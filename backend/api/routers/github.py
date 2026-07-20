import os
import httpx
import re
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.database import supabase

router = APIRouter(prefix="/api/github", tags=["GitHub Integration"])
security = HTTPBearer()


def require_auth(creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = creds.credentials
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return user_res.user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session.")


def get_github_headers():
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="GITHUB_TOKEN is missing in .env")
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }

def clean_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)


def _configured_repo() -> tuple[str, str]:
    owner = os.environ.get("GITHUB_REPO_OWNER")
    repo = os.environ.get("GITHUB_REPO_NAME")
    if not owner or not repo:
        raise HTTPException(
            status_code=500, detail="GitHub repository config missing in .env"
        )
    return owner, repo


@router.get("/commits")
async def get_latest_commits(
    owner: str | None = None,
    repo: str | None = None,
    limit: int = 15,
    _user=Depends(require_auth),
):
    """Commits for the configured product repo only (ignores arbitrary owner/repo)."""
    cfg_owner, cfg_repo = _configured_repo()
    # Lock to configured repo — do not proxy arbitrary GitHub targets with server token
    if owner and owner.lower() != cfg_owner.lower():
        raise HTTPException(status_code=403, detail="Repository not allowed")
    if repo and repo.lower() != cfg_repo.lower():
        raise HTTPException(status_code=403, detail="Repository not allowed")

    url = f"https://api.github.com/repos/{cfg_owner}/{cfg_repo}/commits"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=get_github_headers(), params={"per_page": limit})
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"GitHub API Error: {response.text}")
        
        commits = response.json()
        formatted_commits = []
        for item in commits:
            commit_data = item.get("commit", {})
            author_data = commit_data.get("author", {})
            
            raw_message = commit_data.get("message", "").split("\n")[0]
            clean_message = clean_text(raw_message)
            
            formatted_commits.append({
                "sha": item.get("sha", "")[:7],
                "message": clean_message,
                "author": author_data.get("name", "Unknown"),
                "date": author_data.get("date", ""),
                "url": item.get("html_url", "")
            })
        return formatted_commits

@router.get("/changelog")
async def get_changelog(limit: int = 20):
    """Public product changelog — locked to configured repo (no arbitrary owner/repo)."""
    owner, repo = _configured_repo()
        
    url = f"https://api.github.com/repos/{owner}/{repo}/commits"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            url, 
            headers=get_github_headers(), 
            params={"per_page": limit}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"GitHub API Error: {response.text}")
        
        commits = response.json()
        updates = []
        
        for item in commits:
            commit_data = item.get("commit", {})
            full_message = commit_data.get("message", "")
            
            clean_full_message = clean_text(full_message)
            parts = clean_full_message.split("\n\n", 1)
            
            title = parts[0]
            description = parts[1] if len(parts) > 1 else ""
            
            labels = []
            title_lower = title.lower()
            if "feat" in title_lower or "add" in title_lower:
                labels.append("Feature")
            elif "fix" in title_lower or "bug" in title_lower:
                labels.append("Bug Fix")
            elif "refactor" in title_lower or "update" in title_lower:
                labels.append("Improvement")
            elif "style" in title_lower or "ui" in title_lower:
                labels.append("Design")
            else:
                labels.append("System Update")
                
            updates.append({
                "id": item.get("sha", "")[:7],
                "title": title,
                "description": description,
                "author": commit_data.get("author", {}).get("name", "Unknown"),
                "date": commit_data.get("author", {}).get("date", ""),
                "labels": labels,
                "url": item.get("html_url", "")
            })
            
        return updates

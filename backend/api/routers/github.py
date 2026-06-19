import os
import httpx
import re
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/github", tags=["GitHub Integration"])

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

@router.get("/commits")
async def get_latest_commits(owner: str, repo: str, limit: int = 15):
    if not owner or not repo:
        raise HTTPException(status_code=400, detail="Owner and repo parameters are required")
        
    url = f"https://api.github.com/repos/{owner}/{repo}/commits"
    
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
    owner = os.environ.get("GITHUB_REPO_OWNER")
    repo = os.environ.get("GITHUB_REPO_NAME")
    if not owner or not repo:
        raise HTTPException(status_code=500, detail="GitHub repository config missing in .env")
        
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
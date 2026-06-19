import os
import httpx
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

def get_repo_info():
    owner = os.environ.get("GITHUB_REPO_OWNER")
    repo = os.environ.get("GITHUB_REPO_NAME")
    if not owner or not repo:
        raise HTTPException(status_code=500, detail="GitHub repository config missing in .env")
    return owner, repo

@router.get("/commits")
async def get_latest_commits(limit: int = 10):
    owner, repo = get_repo_info()
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
            formatted_commits.append({
                "sha": item.get("sha", "")[:7], 
                "message": commit_data.get("message", "").split("\n")[0],
                "author": author_data.get("name", "Unknown"),
                "date": author_data.get("date", ""),
                "url": item.get("html_url", "")
            })
        return formatted_commits

@router.get("/changelog")
async def get_changelog(limit: int = 20):
    owner, repo = get_repo_info()
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            url, 
            headers=get_github_headers(), 
            params={"state": "closed", "sort": "updated", "direction": "desc", "per_page": limit}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"GitHub API Error: {response.text}")
        
        prs = response.json()
        merged_prs = []
        for pr in prs:
            if pr.get("merged_at"):
                labels = [label.get("name") for label in pr.get("labels", [])]
                merged_prs.append({
                    "id": pr.get("number"),
                    "title": pr.get("title"),
                    "description": pr.get("body") or "No detailed description provided.",
                    "author": pr.get("user", {}).get("login", "Unknown"),
                    "merged_at": pr.get("merged_at"),
                    "labels": labels,
                    "url": pr.get("html_url")
                })
        return merged_prs
<#
.SYNOPSIS
  Push The Museum of Us (Public Edition) to GitHub and deploy to Vercel.
#>

[CmdletBinding()]
param(
  [string]$RepoName = "our-love-museum",
  [ValidateSet("public", "private")]
  [string]$Visibility = "public",
  [string]$RemoteUrl = "",
  [string]$Branch = "main",
  [string]$VercelProject = "our-love-museum",
  [switch]$SkipGit,
  [switch]$SkipVercel,
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-Step {
  param([string]$Label, [scriptblock]$Action)
  Write-Host "`n==> $Label" -ForegroundColor Magenta
  if ($DryRun) {
    Write-Host "    [dry-run] $($Action.ToString().Trim())" -ForegroundColor DarkGray
    return
  }
  & $Action
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    throw "Command failed during '$Label' (exit code $LASTEXITCODE)."
  }
}

Push-Location -LiteralPath $PSScriptRoot
try {
  Invoke-Step "Validate vercel.json syntax" {
    Get-Content -LiteralPath "vercel.json" -Raw -Encoding UTF8 | ConvertFrom-Json | Out-Null
  }

  if (Get-Command python -ErrorAction SilentlyContinue) {
    Invoke-Step "Verify Python backend compilation" {
      python -m py_compile museum_store.py api/index.py server.py
    }
  }

  if (-not $SkipGit) {
    if (-not (Test-Path -LiteralPath ".git")) {
      Invoke-Step "Initialize git repository on '$Branch'" { git init -b $Branch }
    }
    Invoke-Step "Stage files" { git add -A }
    if ((git status --porcelain) -or $DryRun) {
      Invoke-Step "Commit changes" { git commit -m "Deploy Our Love Museum" }
    }

    $existingOrigin = (git remote get-url origin 2>$null | Out-String).Trim()
    if (-not $existingOrigin) {
      if ($RemoteUrl) {
        Invoke-Step "Attach origin & push '$Branch'" {
          git remote add origin $RemoteUrl
          git push -u origin $Branch
        }
      } elseif (Get-Command gh -ErrorAction SilentlyContinue) {
        $visibilityFlag = if ($Visibility -eq "public") { "--public" } else { "--private" }
        Invoke-Step "Create GitHub repo '$RepoName' ($Visibility) and push" {
          gh repo create $RepoName $visibilityFlag --source . --remote origin --push
        }
      } elseif (-not $DryRun) {
        throw "No 'origin' remote found. Run: git remote add origin <URL>; git push -u origin $Branch"
      }
    } else {
      Invoke-Step "Push '$Branch' to $existingOrigin" { git push -u origin $Branch }
    }
  }

  if (-not $SkipVercel) {
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
      throw "Vercel CLI not installed. Deploy via Vercel Dashboard -> Import Git Repository."
    }
    Invoke-Step "Link Vercel project ($VercelProject)" { vercel link --yes --project $VercelProject }
    Invoke-Step "Deploy to Vercel production" { vercel --prod --yes }
  }
} finally {
  Pop-Location
}

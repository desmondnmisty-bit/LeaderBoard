# Test LeaderBoard API Endpoints

Write-Host "`n========== Testing Health Endpoint ==========`n" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
    Write-Host "✓ Health endpoint working" -ForegroundColor Green
    $health | ConvertTo-Json -Depth 3
} catch {
    Write-Host "✗ Health endpoint failed: $_" -ForegroundColor Red
}

Write-Host "`n`n========== Testing Leaderboard Endpoint ==========`n" -ForegroundColor Cyan
try {
    $leaderboard = Invoke-RestMethod -Uri "http://localhost:3001/top/10?timeRange=all" -Method Get
    Write-Host "✓ Leaderboard endpoint working" -ForegroundColor Green
    Write-Host "Total players: $($leaderboard.data.total)"
    Write-Host "Players returned: $($leaderboard.data.players.Length)"
    $leaderboard.data.players | ForEach-Object { Write-Host "  #$($_.rank) $($_.playerName): $($_.score)" }
} catch {
    Write-Host "✗ Leaderboard endpoint failed: $_" -ForegroundColor Red
}

Write-Host "`n`n========== Testing Score Submission ==========`n" -ForegroundColor Cyan
try {
    $testPlayerId = "test-player-$(Get-Date -Format 'yyyyMMddHHmmss')"
    $body = @{
        playerId = $testPlayerId
        playerName = "Test Player"
        score = 1000
    } | ConvertTo-Json

    $score = Invoke-RestMethod -Uri "http://localhost:3001/score" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Score submission working" -ForegroundColor Green
    Write-Host "Player ID: $($score.data.playerId)"
    Write-Host "Score: $($score.data.score)"
    Write-Host "Rank: $($score.data.rank)"
} catch {
    Write-Host "✗ Score submission failed: $_" -ForegroundColor Red
}

Write-Host "`n`n========== Testing Player Around Endpoint ==========`n" -ForegroundColor Cyan
try {
    $around = Invoke-RestMethod -Uri "http://localhost:3001/around/player-001?timeRange=all" -Method Get
    Write-Host "✓ Player around endpoint working" -ForegroundColor Green
    Write-Host "Player rank: $($around.data.player.rank)"
    Write-Host "Nearby players: $($around.data.nearby.Length)"
} catch {
    Write-Host "✗ Player around endpoint failed: $_" -ForegroundColor Red
}

Write-Host "`n`n========== Summary ==========`n" -ForegroundColor Cyan
Write-Host "API testing complete!" -ForegroundColor Green

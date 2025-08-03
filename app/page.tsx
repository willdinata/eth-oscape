"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Player {
  x: number
  y: number
  width: number
  height: number
  velocityX: number
  velocityY: number
  speed: number
  jumpPower: number
  onGround: boolean
}

interface Enemy {
  x: number
  y: number
  width: number
  height: number
  velocityX: number
  direction: number
}

interface Coin {
  x: number
  y: number
  width: number
  height: number
  collected: boolean
}

interface Platform {
  x: number
  y: number
  width: number
  height: number
  color: string
}

interface Fire {
  x: number
  y: number
  width: number
  height: number
  animationFrame: number
}

interface Pit {
  x: number
  y: number
  width: number
  height: number
}

interface Club {
  x: number
  y: number
  width: number
  height: number
  doorX: number
  doorY: number
  doorWidth: number
  doorHeight: number
}

export default function EthOSGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const playerImageRef = useRef<HTMLImageElement>()
  const enemyImageRef = useRef<HTMLImageElement>()
  const coinImageRef = useRef<HTMLImageElement>()
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [levelComplete, setLevelComplete] = useState(false)
  const [completionCode, setCompletionCode] = useState("")
  const [showCompletion, setShowCompletion] = useState(false)

  // Game state
  const gameState = useRef({
    player: {
      x: 100,
      y: 300,
      width: 40,
      height: 50,
      velocityX: 0,
      velocityY: 0,
      speed: 5,
      jumpPower: 15,
      onGround: false,
    } as Player,
    platforms: [
      { x: 0, y: 400, width: 300, height: 30, color: "#6b7280" }, // Grey ground
      { x: 350, y: 400, width: 200, height: 30, color: "#6b7280" }, // Gap for pit
      { x: 600, y: 400, width: 300, height: 30, color: "#6b7280" }, // Continue ground
      { x: 200, y: 320, width: 150, height: 20, color: "#3b82f6" }, // Blue platform
      { x: 400, y: 250, width: 150, height: 20, color: "#6b7280" }, // Grey platform
      { x: 600, y: 180, width: 150, height: 20, color: "#3b82f6" }, // Blue platform
      { x: 800, y: 300, width: 200, height: 20, color: "#6b7280" }, // Grey platform
      { x: 1050, y: 220, width: 150, height: 20, color: "#3b82f6" }, // Blue platform
      { x: 1250, y: 400, width: 300, height: 30, color: "#6b7280" }, // Final ground
    ] as Platform[],
    coins: [
      { x: 250, y: 280, width: 25, height: 25, collected: false },
      { x: 450, y: 210, width: 25, height: 25, collected: false },
      { x: 650, y: 140, width: 25, height: 25, collected: false },
      { x: 850, y: 260, width: 25, height: 25, collected: false },
      { x: 1100, y: 180, width: 25, height: 25, collected: false },
      { x: 1300, y: 360, width: 25, height: 25, collected: false },
    ] as Coin[],
    enemies: [
      { x: 300, y: 350, width: 40, height: 45, velocityX: 1, direction: 1 },
      { x: 700, y: 270, width: 40, height: 45, velocityX: -1.5, direction: -1 },
      { x: 900, y: 270, width: 40, height: 45, velocityX: 1, direction: 1 },
    ] as Enemy[],
    fires: [
      { x: 320, y: 370, width: 30, height: 30, animationFrame: 0 },
      { x: 520, y: 220, width: 30, height: 30, animationFrame: 0 },
      { x: 780, y: 270, width: 30, height: 30, animationFrame: 0 },
      { x: 1200, y: 370, width: 30, height: 30, animationFrame: 0 },
    ] as Fire[],
    pits: [
      { x: 300, y: 400, width: 50, height: 100 }, // Gap in ground
      { x: 550, y: 400, width: 50, height: 100 }, // Another gap
    ] as Pit[],
    club: {
      x: 1400,
      y: 300,
      width: 120,
      height: 100,
      doorX: 1440,
      doorY: 360,
      doorWidth: 40,
      doorHeight: 40,
    } as Club,
    camera: { x: 0, y: 0 },
    keys: {
      left: false,
      right: false,
      up: false,
    },
  })

  // Load images
  useEffect(() => {
    const playerImg = new Image()
    const enemyImg = new Image()
    const coinImg = new Image()
    let loadedCount = 0

    const checkAllLoaded = () => {
      loadedCount++
      if (loadedCount === 3) {
        setImagesLoaded(true)
      }
    }

    playerImg.onload = checkAllLoaded
    enemyImg.onload = checkAllLoaded
    coinImg.onload = checkAllLoaded

    playerImg.src = "/images/main-character.png"
    enemyImg.src = "/images/enemy.png"
    coinImg.src = "/images/coins.png"

    playerImageRef.current = playerImg
    enemyImageRef.current = enemyImg
    coinImageRef.current = coinImg
  }, [])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          gameState.current.keys.left = true
          break
        case "ArrowRight":
        case "KeyD":
          gameState.current.keys.right = true
          break
        case "ArrowUp":
        case "KeyW":
        case "Space":
          gameState.current.keys.up = true
          e.preventDefault()
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          gameState.current.keys.left = false
          break
        case "ArrowRight":
        case "KeyD":
          gameState.current.keys.right = false
          break
        case "ArrowUp":
        case "KeyW":
        case "Space":
          gameState.current.keys.up = false
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Collision detection
  const checkCollision = (rect1: any, rect2: any) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    )
  }

  // Draw rhombus (diamond shape) for coins
  const drawRhombus = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    const centerX = x + width / 2
    const centerY = y + height / 2
    const halfWidth = width / 2
    const halfHeight = height / 2

    ctx.beginPath()
    ctx.moveTo(centerX, centerY - halfHeight) // Top
    ctx.lineTo(centerX + halfWidth, centerY) // Right
    ctx.lineTo(centerX, centerY + halfHeight) // Bottom
    ctx.lineTo(centerX - halfWidth, centerY) // Left
    ctx.closePath()
  }

  // Update game logic
  const updateGame = () => {
    const { player, platforms, coins, enemies, keys } = gameState.current

    // Handle player input
    if (keys.left) {
      player.velocityX = -player.speed
    } else if (keys.right) {
      player.velocityX = player.speed
    } else {
      player.velocityX *= 0.8 // Friction
    }

    // Jumping
    if (keys.up && player.onGround) {
      player.velocityY = -player.jumpPower
      player.onGround = false
    }

    // Apply gravity
    player.velocityY += 0.8

    // Update player position
    player.x += player.velocityX
    player.y += player.velocityY

    // Platform collision for player
    player.onGround = false
    platforms.forEach((platform) => {
      if (checkCollision(player, platform)) {
        if (player.velocityY > 0 && player.y < platform.y) {
          player.y = platform.y - player.height
          player.velocityY = 0
          player.onGround = true
        }
      }
    })

    // Coin collection
    coins.forEach((coin) => {
      if (!coin.collected && checkCollision(player, coin)) {
        coin.collected = true
        setScore((prev) => prev + 10)
      }
    })

    // Enemy movement
    enemies.forEach((enemy) => {
      enemy.x += enemy.velocityX

      // Simple AI: reverse direction at platform edges
      let onPlatform = false
      platforms.forEach((platform) => {
        if (
          enemy.x + enemy.width > platform.x &&
          enemy.x < platform.x + platform.width &&
          enemy.y + enemy.height >= platform.y - 5 &&
          enemy.y + enemy.height <= platform.y + 25
        ) {
          onPlatform = true
        }
      })

      // Reverse direction at edges or when hitting boundaries
      if (!onPlatform || enemy.x <= 0 || enemy.x >= 1200) {
        enemy.velocityX *= -1
        enemy.direction *= -1
      }

      // Player collision with enemies
      if (checkCollision(player, enemy)) {
        setGameOver(true)
        setGameStarted(false)
      }
    })

    // Update fire animations
    gameState.current.fires.forEach((fire) => {
      fire.animationFrame = (fire.animationFrame + 1) % 20
    })

    // Fire collision
    gameState.current.fires.forEach((fire) => {
      if (checkCollision(player, fire)) {
        setGameOver(true)
        setGameStarted(false)
      }
    })

    // Pit collision (falling into pits)
    gameState.current.pits.forEach((pit) => {
      if (checkCollision(player, pit)) {
        setGameOver(true)
        setGameStarted(false)
      }
    })

    // Club door collision (win condition)
    const club = gameState.current.club
    const door = {
      x: club.doorX,
      y: club.doorY,
      width: club.doorWidth,
      height: club.doorHeight,
    }
    if (checkCollision(player, door)) {
      const code = generateCompletionCode()
      setCompletionCode(code)
      setShowCompletion(true)
      setLevelComplete(true)
      setGameStarted(false)
    }

    // Camera follow player
    gameState.current.camera.x = Math.max(0, player.x - 400)

    // Game over condition (fall off screen)
    if (player.y > 500) {
      setGameOver(true)
      setGameStarted(false)
    }

    // Keep player in bounds horizontally
    if (player.x < 0) player.x = 0

    // Check win condition (all coins collected)
    const allCoinsCollected = coins.every((coin) => coin.collected)
    if (allCoinsCollected) {
      // setGameOver(true)
      // setGameStarted(false)
    }
  }

  // Render game
  const renderGame = () => {
    const canvas = canvasRef.current
    if (!canvas || !imagesLoaded) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { player, platforms, coins, enemies, camera } = gameState.current

    // Clear canvas with sky blue background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#87CEEB")
    gradient.addColorStop(1, "#E0F6FF")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw retro city background
    const drawRetroCity = () => {
      // Set opacity to 15%
      ctx.globalAlpha = 0.15

      // City skyline silhouette
      const buildings = [
        { x: 0, y: 200, width: 80, height: 200 },
        { x: 80, y: 150, width: 60, height: 250 },
        { x: 140, y: 180, width: 70, height: 220 },
        { x: 210, y: 120, width: 90, height: 280 },
        { x: 300, y: 160, width: 75, height: 240 },
        { x: 375, y: 100, width: 85, height: 300 },
        { x: 460, y: 140, width: 65, height: 260 },
        { x: 525, y: 110, width: 95, height: 290 },
        { x: 620, y: 170, width: 70, height: 230 },
        { x: 690, y: 130, width: 80, height: 270 },
      ]

      // Draw buildings with gradient
      buildings.forEach((building, index) => {
        const gradient = ctx.createLinearGradient(0, building.y, 0, building.y + building.height)
        gradient.addColorStop(0, index % 2 === 0 ? "#4c1d95" : "#581c87")
        gradient.addColorStop(1, "#1e1b4b")
        ctx.fillStyle = gradient
        ctx.fillRect(building.x, building.y, building.width, building.height)

        // Add windows
        ctx.fillStyle = "#fbbf24"
        for (let row = 0; row < Math.floor(building.height / 25); row++) {
          for (let col = 0; col < Math.floor(building.width / 15); col++) {
            if (Math.random() > 0.3) {
              // Random window lights
              ctx.fillRect(building.x + col * 15 + 5, building.y + row * 25 + 10, 8, 12)
            }
          }
        }
      })

      // Add neon signs
      ctx.fillStyle = "#ff0080"
      ctx.fillRect(150, 250, 40, 15)
      ctx.fillStyle = "#00ff80"
      ctx.fillRect(320, 220, 35, 12)
      ctx.fillStyle = "#0080ff"
      ctx.fillRect(480, 200, 45, 18)

      // Reset opacity back to full
      ctx.globalAlpha = 1.0
    }

    drawRetroCity()

    // Save context for camera transform
    ctx.save()
    ctx.translate(-camera.x, 0)

    // Draw platforms (grey and blue rectangles)
    platforms.forEach((platform) => {
      ctx.fillStyle = platform.color
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height)

      // Add border for better visibility
      ctx.strokeStyle = "#374151"
      ctx.lineWidth = 2
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height)
    })

    // Draw coins as rhombus shapes
    coins.forEach((coin) => {
      if (!coin.collected && coinImageRef.current) {
        ctx.drawImage(coinImageRef.current, coin.x, coin.y, coin.width, coin.height)
      }
    })

    // Draw enemies using the zombie image
    enemies.forEach((enemy) => {
      if (enemyImageRef.current) {
        ctx.save()
        if (enemy.direction === -1) {
          ctx.scale(-1, 1)
          ctx.drawImage(enemyImageRef.current, -enemy.x - enemy.width, enemy.y, enemy.width, enemy.height)
        } else {
          ctx.drawImage(enemyImageRef.current, enemy.x, enemy.y, enemy.width, enemy.height)
        }
        ctx.restore()
      }
    })

    // Draw fire obstacles
    gameState.current.fires.forEach((fire) => {
      const flameHeight = 20 + Math.sin(fire.animationFrame * 0.5) * 5

      // Draw flame base
      ctx.fillStyle = "#ff4500"
      ctx.fillRect(fire.x, fire.y + fire.height - 15, fire.width, 15)

      // Draw animated flame
      ctx.fillStyle = "#ff6600"
      ctx.fillRect(fire.x + 5, fire.y + fire.height - flameHeight, fire.width - 10, flameHeight - 15)

      // Draw flame tip
      ctx.fillStyle = "#ffff00"
      ctx.fillRect(fire.x + 10, fire.y + fire.height - flameHeight, fire.width - 20, 8)
    })

    // Draw pits (dark holes)
    gameState.current.pits.forEach((pit) => {
      ctx.fillStyle = "#000000"
      ctx.fillRect(pit.x, pit.y, pit.width, pit.height)

      // Add danger stripes
      ctx.fillStyle = "#ff0000"
      for (let i = 0; i < pit.width; i += 10) {
        ctx.fillRect(pit.x + i, pit.y - 5, 5, 5)
      }
    })

    // Draw retro club
    const club = gameState.current.club
    // Club building
    ctx.fillStyle = "#8b5cf6" // Purple club color
    ctx.fillRect(club.x, club.y, club.width, club.height)

    // Club roof
    ctx.fillStyle = "#6d28d9"
    ctx.fillRect(club.x - 10, club.y - 20, club.width + 20, 20)

    // Club sign
    ctx.fillStyle = "#ff1493"
    ctx.fillRect(club.x + 10, club.y + 10, 100, 25)
    ctx.fillStyle = "#ffffff"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Eth OS Center", club.x + 60, club.y + 27)

    // Club door
    ctx.fillStyle = "#654321"
    ctx.fillRect(club.doorX, club.doorY, club.doorWidth, club.doorHeight)

    // Door handle
    ctx.fillStyle = "#ffd700"
    ctx.fillRect(club.doorX + club.doorWidth - 8, club.doorY + club.doorHeight / 2 - 2, 4, 4)

    // Club windows
    ctx.fillStyle = "#ffff00"
    ctx.fillRect(club.x + 15, club.y + 45, 15, 15)
    ctx.fillRect(club.x + 90, club.y + 45, 15, 15)

    // Neon effect around club
    ctx.strokeStyle = "#ff00ff"
    ctx.lineWidth = 3
    ctx.strokeRect(club.x - 2, club.y - 2, club.width + 4, club.height + 4)

    // Draw player using the character image
    if (playerImageRef.current) {
      ctx.save()
      if (player.velocityX < 0) {
        ctx.scale(-1, 1)
        ctx.drawImage(playerImageRef.current, -player.x - player.width, player.y, player.width, player.height)
      } else {
        ctx.drawImage(playerImageRef.current, player.x, player.y, player.width, player.height)
      }
      ctx.restore()
    }

    // Restore context
    ctx.restore()

    // Draw UI
    ctx.fillStyle = "#000000"
    ctx.font = "24px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`Score: ${score}`, 20, 40)

    // Draw coins remaining
    const coinsLeft = coins.filter((coin) => !coin.collected).length
    ctx.fillText(`Coins Left: ${coinsLeft}`, 20, 70)
  }

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameStarted && !gameOver && imagesLoaded) {
      updateGame()
      renderGame()
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
  }, [gameStarted, gameOver, imagesLoaded])

  useEffect(() => {
    if (gameStarted && imagesLoaded) {
      gameLoop()
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameLoop])

  // Generate 7-character code
  const generateCompletionCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Start game
  const startGame = () => {
    setShowCompletion(false)
    setCompletionCode("")

    if (!imagesLoaded) return

    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    setLevelComplete(false)

    // Reset game state
    gameState.current.player = {
      x: 100,
      y: 300,
      width: 40,
      height: 50,
      velocityX: 0,
      velocityY: 0,
      speed: 5,
      jumpPower: 15,
      onGround: false,
    }

    gameState.current.coins.forEach((coin) => (coin.collected = false))
    gameState.current.camera = { x: 0, y: 0 }

    // Reset enemies
    gameState.current.enemies = [
      { x: 300, y: 350, width: 40, height: 45, velocityX: 1, direction: 1 },
      { x: 700, y: 270, width: 40, height: 45, velocityX: -1.5, direction: -1 },
      { x: 900, y: 270, width: 40, height: 45, velocityX: 1, direction: 1 },
    ]
  }

  const allCoinsCollected = gameState.current.coins.every((coin) => coin.collected)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-blue-600">Eth OScape</CardTitle>
          <p className="text-lg text-muted-foreground">Only the luckiest can validate their victory!</p>
          <p className="text-sm text-gray-600 mt-2">Developed by Will Dinata</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold">Score: {score}</div>
            {!gameStarted && !gameOver && (
              <Button onClick={startGame} size="lg" disabled={!imagesLoaded}>
                {imagesLoaded ? "Start Game" : "Loading..."}
              </Button>
            )}
            {gameOver && (
              <div className="text-center space-y-2">
                <div className="text-xl font-bold text-red-600">Game Over!</div>
                <div className="text-sm text-red-500">
                  {allCoinsCollected
                    ? "You collected all coins but didn't reach the club!"
                    : "Avoid the fire, pits, and zombies!"}
                </div>
                <Button onClick={startGame} size="lg">
                  Try Again
                </Button>
              </div>
            )}
            {showCompletion && (
              <div className="text-center space-y-4 bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-lg text-white">
                <div className="text-3xl font-bold">🎉 Welcome to Eth OS Center! 🎉</div>
                <div className="text-xl">Mission Complete!</div>

                <div className="bg-black/20 p-4 rounded-lg space-y-2">
                  <div className="text-lg font-semibold">Final Results:</div>
                  <div className="text-2xl font-bold text-yellow-300">Total Points: {score}</div>
                </div>

                <div className="bg-yellow-100 p-4 rounded-lg border-2 border-yellow-400">
                  <div className="text-sm font-semibold text-yellow-800">Your Completion Code:</div>
                  <div className="text-4xl font-mono font-bold text-yellow-900 tracking-wider">{completionCode}</div>
                  <div className="text-xs text-yellow-700 mt-2">Save this code - it's your proof of completion!</div>
                </div>

                <div className="bg-blue-100 p-3 rounded-lg border border-blue-300">
                  <div className="text-sm text-blue-800 font-medium">Developed by Will Dinata</div>
                </div>

                <Button
                  onClick={() => {
                    setShowCompletion(false)
                    setCompletionCode("")
                    startGame()
                  }}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Play Again
                </Button>
              </div>
            )}
          </div>

          <canvas
            ref={canvasRef}
            width={800}
            height={450}
            className="border-2 border-gray-300 rounded-lg w-full max-w-full"
            style={{ imageRendering: "pixelated" }}
          />

          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              <strong>Controls:</strong>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <div>← A: Move Left</div>
              <div>→ D: Move Right</div>
              <div>↑ W Space: Jump</div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Collect coins, avoid fire and pits, dodge zombies, and enter the retro club door to win!
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

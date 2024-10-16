package main

import (
	"backend_go/db"
	"backend_go/middlewares"
	"backend_go/routes"
	"fmt"
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.Static("/user_photos", "./user_photos")
	config := cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://10.188.27.252:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	r.Use(cors.New(config))

	r.Use(func(c *gin.Context) {
		log.Printf("Incoming request: %s %s", c.Request.Method, c.Request.URL.Path)
		log.Println("CORS Middleware triggered")
		log.Printf("Origin: %s", c.GetHeader("Origin"))
		fmt.Printf("Request %v Headers:\n", c.Request.Method)
		for k, v := range c.Request.Header {
			fmt.Println(k, v)
		}
		c.Next()

		fmt.Printf("Response Headers:\n")
		for k, v := range c.Writer.Header() {
			fmt.Println(k, v)
		}
	})

	conn, err := db.InitDatabase()

	if err != nil {
		log.Fatalf("Failed to connect to the database: %v", err)
	}

	defer conn.Close()

	public := r.Group("/")
	routes.SetupPublicRoutes(public, conn)

	protected := r.Group("/")
	protected.Use(middlewares.AuthMiddleware())
	routes.SetupProtectedRoutes(protected, conn)

	doctorOnly := protected.Group("/")
	doctorOnly.Use(middlewares.DoctorOnly())
	routes.SetupDoctorOnlyRoutes(doctorOnly, conn)

	r.Use(func(c *gin.Context) {
		for k, v := range c.Writer.Header() {
			fmt.Println(k, v)
		}
	})
	r.Run(":3001")
}

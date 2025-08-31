package utils

import (
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func GeneratePresignedURL(presignClient *s3.PresignClient, bucket, key string) (string, error) {
	request, err := presignClient.PresignGetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Minute * 5
	})
	if err != nil {
		log.Println("Error creating the presigned URL:", err)
		return "", err
	}

	log.Println("Generated presigned URL:", request.URL)
	return request.URL, nil
}

func createS3Client() (*s3.Client, error) {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %v", err)
	}

	if cfg.Region == "" {
		return nil, fmt.Errorf("AWS region not found in environment variables, config file, or instance metadata")
	}

	s3Client := s3.NewFromConfig(cfg)
	return s3Client, nil
}

func UploadToS3(file multipart.File, handler *multipart.FileHeader, filePath string) error {
	s3Client, err := createS3Client()
	if err != nil {
		log.Printf("Warning: Failed to create S3 client: %v", err)
		return fmt.Errorf("S3 not configured: %v", err)
	}

	bucket := os.Getenv("S3_BUCKET_NAME")
	if bucket == "" {
		return fmt.Errorf("S3_BUCKET_NAME environment variable is not set")
	}

	_, err = s3Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:        aws.String(bucket),
		Key:           aws.String(filePath),
		Body:          file,
		ContentLength: aws.Int64(handler.Size),
		ContentType:   aws.String(handler.Header.Get("Content-Type")),
	})

	if err != nil {
		log.Printf("Error uploading file to S3: %v\n", err)
		return err
	}
	return nil
}

func DeleteFromS3(filePath string) error {
	s3Client, err := createS3Client()
	if err != nil {
		log.Printf("Warning: Failed to create S3 client: %v", err)
		return fmt.Errorf("S3 not configured: %v", err)
	}

	bucket := os.Getenv("S3_BUCKET_NAME")
	if bucket == "" {
		return fmt.Errorf("S3_BUCKET_NAME environment variable is not set")
	}

	_, err = s3Client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(filepath.ToSlash(filePath)),
	})

	if err != nil {
		log.Printf("Error deleting file from S3: %v\n", err)
		return err
	}

	return nil
}

func GeneratePresignedObjectURL(key string) (string, error) {
	client, err := createS3Client()
	if err != nil {
		log.Printf("Warning: Failed to create S3 client: %v", err)
		return "", fmt.Errorf("S3 not configured: %v", err)
	}

	presignClient := s3.NewPresignClient(client)
	bucket := os.Getenv("S3_BUCKET_NAME")
	if bucket == "" {
		log.Println("S3_BUCKET_NAME environment variable is not set")
		return "", fmt.Errorf("S3_BUCKET_NAME environment variable is not set")
	}

	req, err := presignClient.PresignGetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Minute * 5
	})
	if err != nil {
		log.Printf("Error generating presigned URL for key %s: %v", key, err)
		return "", err
	}
	return req.URL, nil
}

func UploadToS3WithReader(filePath string, content io.Reader, contentLength int64, contentType string) error {
	filePath = filepath.ToSlash(filePath)

	s3Client, err := createS3Client()
	if err != nil {
		log.Printf("Warning: Failed to create S3 client: %v", err)
		return fmt.Errorf("S3 not configured: %v", err)
	}

	bucket := os.Getenv("S3_BUCKET_NAME")
	if bucket == "" {
		return fmt.Errorf("S3_BUCKET_NAME environment variable is not set")
	}

	_, err = s3Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:        aws.String(bucket),
		Key:           aws.String(filePath),
		Body:          content,
		ContentLength: aws.Int64(contentLength),
		ContentType:   aws.String(contentType),
	})

	if err != nil {
		log.Printf("Error uploading file to S3: %v\n", err)
		return err
	}
	return nil
}

func DownloadFromS3(filePath string) (io.ReadCloser, error) {
	s3Client, err := createS3Client()
	if err != nil {
		log.Printf("Warning: Failed to create S3 client: %v", err)
		return nil, fmt.Errorf("S3 not configured: %v", err)
	}

	bucket := os.Getenv("S3_BUCKET_NAME")
	if bucket == "" {
		return nil, fmt.Errorf("S3_BUCKET_NAME environment variable is not set")
	}

	result, err := s3Client.GetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(filePath),
	})
	if err != nil {
		log.Printf("Error downloading file from S3: %v\n", err)
		return nil, err
	}

	return result.Body, nil
}

func CopyS3Object(sourceKey, destKey string) error {
	s3Client, err := createS3Client()
	if err != nil {
		log.Printf("Warning: Failed to create S3 client: %v", err)
		return fmt.Errorf("S3 not configured: %v", err)
	}

	bucket := os.Getenv("S3_BUCKET_NAME")
	if bucket == "" {
		return fmt.Errorf("S3_BUCKET_NAME environment variable is not set")
	}

	_, err = s3Client.CopyObject(context.TODO(), &s3.CopyObjectInput{
		Bucket:     aws.String(bucket),
		CopySource: aws.String(bucket + "/" + sourceKey),
		Key:        aws.String(destKey),
	})

	if err != nil {
		log.Printf("Error copying S3 object from %s to %s: %v\n", sourceKey, destKey, err)
		return err
	}

	return nil
}

func GetAWSConfig() (aws.Config, error) {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		return aws.Config{}, fmt.Errorf("failed to load AWS config: %v", err)
	}

	if cfg.Region == "" {
		return aws.Config{}, fmt.Errorf("AWS region not found in environment variables, config file, or instance metadata")
	}

	return cfg, nil
}

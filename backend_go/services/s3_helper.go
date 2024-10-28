package services

import (
	"log"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
)

func UploadToS3(file multipart.File, handler *multipart.FileHeader, filePath string) error {
	s3Client := createS3Client()

	bucket := os.Getenv("S3_BUCKET_NAME")

	_, err := s3Client.PutObject(&s3.PutObjectInput{
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
	log.Printf("File uploaded to S3 successfully: %s", filePath)
	return nil
}

func DeleteFromS3(filePath string) error {
	s3Client := createS3Client()
	bucket := os.Getenv("S3_BUCKET_NAME")

	_, err := s3Client.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(filepath.ToSlash(filePath)),
	})

	if err != nil {
		log.Printf("Error deleting file from S3: %v\n", err)
		return err
	}

	log.Printf("File deleted from S3: %s", filePath)
	return nil
}

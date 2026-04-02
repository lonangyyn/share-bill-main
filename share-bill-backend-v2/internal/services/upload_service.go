package services

import (
	"context"
	"mime/multipart"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type UploadService struct {
	cld *cloudinary.Cloudinary
}

// Khoi tao UploadService voi cloudinary url
func NewUploadService(cloudinaryURL string) (*UploadService, error) {
	cld, err := cloudinary.NewFromURL(cloudinaryURL)
	if err != nil {
		return nil, err
	}
	return &UploadService{cld: cld}, nil
}

// Upload file len cloudinary va tra url
func (s *UploadService) UploadImage(ctx context.Context, file multipart.File, filename string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	resp, err := s.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:    "sharever_uploads",
		PublicID:  filename,
		Overwrite: api.Bool(true),
	})
	if err != nil {
		return "", err
	}
	return resp.SecureURL, nil
}
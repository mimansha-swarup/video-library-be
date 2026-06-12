import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, bucketName } from '../config/backblaze';
import { config } from '../config/env';

export class VideoService {
  /**
   * Generate a signed URL for streaming a video
   */
  async getSignedStreamUrl(videoKey: string): Promise<string> {
    console.log('📹 Generating signed URL...');
    console.log('   Bucket:', bucketName);
    console.log('   Key:', videoKey);
    console.log('   Endpoint:', config.backblaze.endpoint);

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: videoKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: config.signedUrlExpirySeconds,
    });

    console.log('   Signed URL generated:', signedUrl.substring(0, 100) + '...');
    return signedUrl;
  }

  /**
   * Upload a video to Backblaze B2 by streaming from a temp file path
   */
  async uploadVideo(
    videoKey: string,
    filePath: string,
    contentType: string
  ): Promise<string> {
    const { size } = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: videoKey,
      Body: fileStream,
      ContentType: contentType,
      ContentLength: size,
    });

    await s3Client.send(command);

    return videoKey;
  }

  /**
   * Delete a video from Backblaze B2
   */
  async deleteVideo(videoKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: videoKey,
    });

    await s3Client.send(command);
  }

  /**
   * Generate a video key path based on course/module/lesson structure
   */
  generateVideoKey(courseSlug: string, moduleOrder: number, lessonOrder: number, filename: string): string {
    const extension = filename.split('.').pop() || 'mp4';
    return `courses/${courseSlug}/module-${moduleOrder}/lesson-${lessonOrder}.${extension}`;
  }
}

export const videoService = new VideoService();

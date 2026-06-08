import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

let client: S3Client | null = null

export function getMinioClient() {
  if (!client) {
    client = new S3Client({
      region: requireEnv("MINIO_REGION"),
      endpoint: requireEnv("MINIO_ENDPOINT"),
      credentials: {
        accessKeyId: requireEnv("MINIO_ACCESS_KEY"),
        secretAccessKey: requireEnv("MINIO_SECRET_KEY"),
      },
      forcePathStyle: process.env.MINIO_FORCE_PATH_STYLE !== "false",
    })
  }

  return client
}

export function getMinioBucket() {
  return requireEnv("MINIO_BUCKET")
}

export async function uploadAgentFileToMinio({
  key,
  body,
  contentType,
}: {
  key: string
  body: Buffer
  contentType: string
}) {
  await getMinioClient().send(
    new PutObjectCommand({
      Bucket: getMinioBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

export async function deleteAgentFileFromMinio(key: string) {
  await getMinioClient().send(
    new DeleteObjectCommand({
      Bucket: getMinioBucket(),
      Key: key,
    })
  )
}

function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required.`)
  }

  return value
}

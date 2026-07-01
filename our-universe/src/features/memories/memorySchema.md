Firestore Memory Document Schema

Collection: `memories`

Document fields:
- title: string (required)
- description: string (optional)
- date: timestamp (required) - Firestore Timestamp
- photos: array of objects [{ url: string, storagePath: string, filename: string, createdAt: Timestamp }]
- videos: array of objects [{ url, storagePath, filename, createdAt }]
- screenshots: array of objects [{ url, storagePath, filename, createdAt }]
- voiceNotes: array of objects [{ url, storagePath, filename, lengthSeconds, createdAt }]
- chatRefs: array of message IDs or small snapshot objects [{ messageId, text, sender, timestamp }]
- createdBy: string (uid)
- createdAt: timestamp
- updatedAt: timestamp
- visibility: string enum ['private','shared'] (default 'private')
- tags: array of strings

Notes:
- Store media files in Firebase Storage under `memories/{memoryId}/photos/...`, `memories/{memoryId}/videos/...`, etc. Save `storagePath` and `url` in the document for quick access.
- Keep media file sizes reasonable and generate thumbnails on upload for large videos.
- Use Firestore security rules to ensure only the owner (createdBy) can write/delete unless shared.

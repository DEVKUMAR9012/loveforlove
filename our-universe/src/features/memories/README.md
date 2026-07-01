Memory Vault — Implementation Notes

Files added:
- `memorySchema.md` — Firestore document schema
- `memoryService.js` — helper functions for CRUD and media uploads
- Components:
  - `MemoryForm.jsx` — create new memory form with file uploads
  - `MemoryList.jsx` — list memories and delete
  - `MemoryCard.jsx` — memory preview card

How it works:
- Media files are uploaded to Firebase Storage under `memories/{memoryId}/{type}/{timestamp_filename}`.
- The Firestore document stores arrays for `photos`, `videos`, `screenshots`, and `voiceNotes`, each item containing `url`, `storagePath`, `filename`, `createdAt`.
- Use the `memoryService` functions to create, list, update, and delete memories.

Usage (example):
- Import and render the components in a page:

```jsx
import MemoryForm from '../components/features/MemoryForm'
import MemoryList from '../components/features/MemoryList'

export default function MemoryVaultPage() {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Memory Vault</h1>
      <MemoryForm onCreated={(id)=>console.log('created', id)} />
      <div className="mt-6">
        <MemoryList />
      </div>
    </div>
  )
}
```

Security & Performance Notes:
- Enforce Firestore rules so only owners can modify their memories.
- For large video/audio files, consider client-side compression or server-side transcoding.
- For thumbnails, generate client-side previews for images and short poster frames for videos before upload, or store small preview images alongside the original.

Next steps:
- Add optimistic UI updates and progress bars for uploads.
- Add edit UI to remove individual files from a memory.
- Integrate thumbnail generation for video uploads.

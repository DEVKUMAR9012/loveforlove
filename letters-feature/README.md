# Letters / Messages Feature — Integration Guide

## Kya mila is package mein

```
backend/
  models/Letter.js        → Mongoose schema
  routes/letters.js       → GET list, GET one, POST send, DELETE
frontend/
  assets/letter-themes/   → 6 usable theme images (2 blank uploads skip kiye)
  components/
    letterThemes.js       → theme registry — image + text position config
    ThemePicker.jsx        → theme selection grid
    LetterWriter.jsx       → write screen with live overlay
    LettersPage.jsx        → list + read + orchestrates all views
```

## Backend wiring (3 steps)

1. Copy `backend/models/Letter.js` → apne `models/` folder mein
2. Copy `backend/routes/letters.js` → apne `routes/` folder mein
3. `server.js` / `app.js` mein register karo:
   ```js
   const letterRoutes = require('./routes/letters');
   app.use('/api/letters', letterRoutes);
   ```

**Check karo:** `routes/letters.js` ke top pe do imports hain jo tumhare actual paths se match karne chahiye:
```js
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
```
Agar tumhare project mein ye alag naam/path pe hain to sirf ye 2 lines badalni hain.

Ye assume karta hai `User` model mein already `partnerId` field hai (jo tumhare "Partner Linked" feature se aa raha hoga — screenshot mein dikha).

## Frontend wiring (2 steps)

1. `frontend/assets/letter-themes/*` → apne project ke `src/assets/letter-themes/` mein copy karo
2. `frontend/components/*` → apne `src/components/` mein copy karo, phir apne router mein:
   ```jsx
   import LettersPage from './components/LettersPage';
   // <Route path="/messages" element={<LettersPage />} />
   ```
3. Dashboard ke "Messages" card ko is route pe link karo (`/messages`)

**Font:** Components `'Caveat'` cursive font use kar rahe hain (handwriting jaisa look, image 2 ke reference se). Google Fonts se add karo `index.html` mein:
```html
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap" rel="stylesheet">
```
Agar koi aur font pasand hai to sirf `letterThemes.js` mein `fontFamily` change karna hai — sab jagah se apply ho jayega.

## Naya theme add karna (future)

`letterThemes.js` ke alawa kahi kuch nahi chhedna:
1. Image ko `assets/letter-themes/` mein daalo
2. Import karo aur `LETTER_THEMES` object mein ek entry add karo
3. `textArea` position tune karo (top/left/width/height) taaki text blank space pe hi aaye

## Note — 2 uploaded images skip kiye

Images 4 aur 7 tumhare upload mein blank/corrupted the (koi visible content nahi), isliye 6 themes hi include kiye hain. Agar wo actually valid hain to unhe bhi add kar sakte ho same pattern follow karke.

## Socket.io real-time (optional, next step)

`routes/letters.js` mein ek `TODO` comment hai POST route mein — wahan `io.to(partnerId).emit('new_letter', letter)` add karke real-time notification bhi laga sakte ho, jaisa tumhare baaki app mein Socket.io already use ho raha hai.

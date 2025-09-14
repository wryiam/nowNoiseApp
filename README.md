# nowNoise  

**nowNoise** is a social music discovery app built with **React Native** (frontend) and **Flask** (backend), powered by the **Spotify Web API**.  
Our mission is simple but powerful: **put music discovery back in the hands of real people — not algorithms.**  

Instead of endless recommendation feeds, nowNoise fosters a **community-first model** where users share, explore, and connect through real-time listening.  

> ⚠️ **Work in Progress:** nowNoise is still in active development. Core functionality is live (Spotify login, swipe-based exploration, and backend logic), but we are continuously refining the experience, UI, and recommendation algorithm.  

---

## Features  

- ### Real-Time Music Sharing 
  Post what you’re listening to instantly, and see what others are vibing with.

- ### Community Building 
  Create new connections and make new friends with people who share your music tastes. 

- ### Swipe-to-Discover (Explore Page) 
  - Swipe **right** to like a track.  
  - Swipe **left** to pass.  
  - Build your taste profile dynamically as you explore.  

- ### Community-First Algorithm 
  Our backend algorithm uses aggregated, anonymized community input to surface tracks — centering **real people** over opaque recommendation engines.  

- ### Spotify Integration**  
  Connect your account to seamlessly import data and enrich your music discovery journey.  

- ### Cross-Platform 
  Built with React Native for iOS + Android with a unified codebase.  

- ### RPrivacy-First
  We only request the minimum Spotify permissions required. No unnecessary data hoarding.  

---

## 📸 Screenshots  

### Explore Page (Swipe to Discover)  
<img width="191" height="486" alt="Image" src="https://github.com/user-attachments/assets/bcf5c26a-dd36-4e5d-bf5b-b146dcbfb490" />
<img width="191" height="486" alt="Image" src="https://github.com/user-attachments/assets/2b0e188e-f734-4e21-a5c9-b300ca7d68fc" />

<img width="191" height="486" alt="Image" src="https://github.com/user-attachments/assets/f2584f68-57bb-46d9-ac8e-664aa9078967" />
<img width="191" height="486" alt="Image" src="https://github.com/user-attachments/assets/bba82356-d92c-4a5b-9350-29be656ddfdc" />

*(UI is subject to change as we refine design and interaction flow.)*  

---

## 🛠️ Tech Stack  

**Frontend (Mobile App)**  
- React Native (Expo)  
- Tailwind CSS for styling  
- Context API for state management  

**Backend (API + Algorithm)**  
- Flask (Python)  
- Spotify Web API  
- PostgreSQL database  
- Custom music discovery algorithm (community-driven, evolving)  

**Deployment**  
- Backend: Flask API (Heroku / Render)  
- Mobile: iOS (TestFlight) & Android (Internal Testing)  

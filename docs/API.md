# API Reference

Base URL: `http://localhost:5000/api`
Zyada tar routes mein header zaroori hai: `Authorization: Bearer <token>` (token login/signup par milta hai).
Errors: `{ "message": "..." }` ke saath 400/401/403/404/500.

## Auth (`/api/auth`)
| Method | Path | Kaam |
|---|---|---|
| POST | `/signup` | Naya account |
| POST | `/login` | Login, token wapas |
| POST | `/forgot-password` | Reset link email |
| POST | `/reset-password/:token` | Naya password |
| PUT | `/profile` | Profile update (auth) |
| PUT | `/password` | Password badalna (auth) |
| DELETE | `/account` | Account aur saara data delete (auth, password zaroori) |
| GET | `/export` | Apna data export (auth) |

## Tracking (auth zaroori; sab mein `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`)
| Base path | Data |
|---|---|
| `/api/workouts` | Workouts |
| `/api/nutrition` | Khana, calories, macros |
| `/api/weight` | Weight entries |
| `/api/measurements` | Body measurements |
| `/api/performance` | Strength/cardio records |

List routes pagination support karte hain: `?page=1`; headers `X-Total-Count` wagera.

## Goals aur Settings (auth)
| Method | Path | Kaam |
|---|---|---|
| GET / PUT | `/api/goals` | Goals dekhna / badalna |
| GET / PUT | `/api/settings` | Settings dekhna / badalna |

## Notifications (`/api/notifications`, auth)
| Method | Path | Kaam |
|---|---|---|
| GET | `/` | Meri notifications |
| DELETE | `/` | Sab saaf |
| PUT | `/read-all` | Sab read |
| PUT | `/:id/read` | Ek read |
| DELETE | `/:id` | Ek delete |

## Support (`/api/support`, auth)
| Method | Path | Kaam |
|---|---|---|
| POST | `/` | Naya ticket |
| GET | `/` | Mere tickets |
| POST | `/:id/reply` | Apne ticket par reply |
| GET | `/admin/all` | Saare tickets (**sirf admin**) |
| POST | `/admin/:id/reply` | Admin reply (**sirf admin**) |
| PATCH | `/admin/:id/status` | Ticket ka status (**sirf admin**) |

## Community (`/api/users`, auth)
| Method | Path | Kaam |
|---|---|---|
| GET | `/search?q=ali&page=1` | Users dhoondhna (kam az kam 2 characters) |
| GET | `/suggestions` | Suggested users |
| GET | `/me/followers` | Mere followers |
| GET | `/me/following` | Jin ko main follow karta hoon |
| POST | `/:id/follow` | Follow |
| DELETE | `/:id/follow` | Unfollow |

## Forum (`/api/forum`, auth)
| Method | Path | Kaam |
|---|---|---|
| GET | `/?page=1&search=diet` | Posts (10 per page, body ka preview) |
| POST | `/` | Naya post (title max 120, body max 2000) |
| GET | `/:id` | Post replies ke saath |
| DELETE | `/:id` | Apni post delete |
| POST | `/:id/replies` | Reply (max 1000 characters, 200 replies per post) |
| DELETE | `/:id/replies/:replyId` | Apna reply delete |

## Health (bina auth)
| Method | Path | Kaam |
|---|---|---|
| GET | `/health` | Server aur database ki halat |
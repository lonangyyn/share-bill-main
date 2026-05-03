# ShareBill (Sharever) - Personal Enhance

🌐 **Live Demo:** [https://sharever.vercel.app/](https://sharever.vercel.app/)

### DATH-251 – Team N8

A web application that helps travel/offline groups track shared expenses, automatically calculate who owes whom, and generate accurate VietQR codes for settlement.

---

## Project Overview

ShareBill allows a group of friends to easily record expenses during a trip, automatically computes debts/surpluses for each member, and instantly generates personalized VietQR codes so everyone can settle with one scan (including refunds for those who overpaid).

## Team N8 Members

| Student ID | Full Name             | Role                                   |
| ---------- | --------------------- | -------------------------------------- |
| 2313624    | Trần Đỗ Cao Trí       | Design UML, Backend                    |
| 2352708    | Đinh Cao Thiên Lộc    | Design UML, Report                     |
| 2311883    | Nguyễn Thị Kim Loan   | Design UML + Database, Backend, Deploy |
| 2352918    | Nguyễn Lê Đức Phú     | Design UML, Frontend                   |
| 2352770    | Trần Hà My            | Design UML, Report                     |
| 2153485    | Nguyễn Quang Khởi     | Design UML, Frontend                   |
| 2311987    | Nguyễn Song Minh Luân | Design UML, Frontend                   |

## Tech Stack & Infrastructure

- **Frontend:** React + TypeScript + Vite + TailwindCSS (Hosted on **Vercel**)
- **Backend:** Go 1.23 + Fiber (Hosted on **Render**)
- **Database:** PostgreSQL 16 + Redis 7 (Hosted on Cloud)
- **External Services:**
  - **SendGrid API:** For sending OTP emails
  - **VietQR / go-qrcode:** For payment QR generation
  - **Cloudinary:** For image/avatar storage

---

## Local Development Setup

**1. Clone repository**

```bash
git clone https://github.com/dath-251-thuanle/share-bill.git
```

### Setup environment variables

Create `.env` file from the provided example:

```bash
copy example.env .env
```

### Run backend

```bash
cd share-bill-backend
docker compose up --build -d
```

### Run frontend

```bash
cd sharever-frontend
npm install
npm run dev
```

#### Notes

Frontend is served using Vite dev server and requires npm run dev to be running.
Backend services are fully containerized using Docker Compose.
This setup is intended for development, testing, and course demonstration.

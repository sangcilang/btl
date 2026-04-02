# Report Approval Frontend

Frontend su dung React + TypeScript + Vite, toi uu cho de tach module va de bao tri.

## Cau truc

- `src/lib`: ham goi API va quan ly local storage.
- `src/features/auth`: man hinh dang nhap.
- `src/features/reports`: tao bao cao va hien thi danh sach bao cao.
- `src/features/approval`: danh sach cho duyet va thao tac duyet.
- `src/types.ts`: cac kieu du lieu dung chung.

## Bien moi truong

Tao file `.env` trong thu muc `frontend`:

```env
VITE_API_BASE_URL=http://localhost:5255
```

## Chay du an

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
npm run preview
```

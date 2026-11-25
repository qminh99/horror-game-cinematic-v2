# SEGFAULT: Ngõ 165 — Cinematic 3D Pipeline (v2)

Project nền tảng mới tách biệt hoàn toàn khỏi kiến trúc ghép khối hộp cũ, chuyển sang quy trình **Blender PBR/Rig (`.glb`) -> Three.js Cinematic Engine (HDRI + ACES + Bloom + Optical Bokeh DoF)**.

## Cách chạy
```bash
npm install
npm run dev
```

Mở `http://localhost:5173`. Màn hình khởi động tích hợp sẵn bộ kiểm tra **Asset Contract** để báo chính xác file `.glb`, node, hoặc clip nào đã sẵn sàng và phần nào Codex cần xuất từ Blender.

## Tài liệu phối hợp
- `docs/ASSET_CONTRACT.md`: Hợp đồng kỹ thuật tên node, animation timeline 972 frames (40.5s @ 24fps) và danh sách âm thanh.
- `docs/CODEX_HANDOFF.md`: Các bước và prompt giao việc cụ thể cho Codex chạy với Blender CLI và `.agents/skills/`.

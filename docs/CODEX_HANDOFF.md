# Kế hoạch phối hợp với Codex (Blender Skills Pipeline)

Dự án này đã hoàn thiện toàn bộ phần **Web Runtime Engine** (Three.js + PBR + HDRI + Bloom + Optical Bokeh Depth-of-Field + 8s Flicker Controller + Audio Timeline + Asset Validator).

Việc của **Codex** (sử dụng Blender CLI và bộ skill trong `.agents/skills/` từ repo cũ) là sản xuất tài nguyên 3D chân thực theo đúng `docs/ASSET_CONTRACT.md` và xuất thẳng vào `public/assets/`.

## Bước chuẩn bị trên máy local (macOS)
1. Copy thư mục `.agents/` và `.codex/` từ repo cũ (`Phong-Ngu-3D-cho-ban`) sang thư mục gốc của project mới này.
2. Cài dependency web:
   ```bash
   npm install
   npm run dev
   ```
3. Đảm bảo đã cài Blender (4.0+) và gọi được từ terminal (`blender --version`).
4. Đặt video tham chiếu (short film intro vừa tạo) vào `docs/reference_intro.mp4` để đối chiếu ánh sáng, bố cục và tốc độ hành động.

---

## Các Prompt giao việc tuần tự cho Codex

### Task 1 — Khóa Look-Dev, Ánh sáng & HDRI
*(Dùng skill: `cinematography-lighting`, `storyboard-artist`, `horror-atmosphere-design`)*

> Đọc `docs/ASSET_CONTRACT.md` và tham chiếu video `docs/reference_intro.mp4`. Hãy chuẩn bị `public/assets/hdri/night_street_1k.hdr` (hoặc tạo môi trường đêm chuẩn PBR) và thiết kế file Blender cơ sở `blender/bus_lookdev.blend` với bảng màu đêm ấm áp nhưng hơi mệt mỏi: đèn trần xe buýt trung tính hơi ấm (3900K), bóng mềm, kính phản xạ vừa phải không che ngoại cảnh, đường phố bên ngoài tối hơn trong xe nhưng vẫn nhìn rõ mặt đường và căn nhà trọ. Render 3 ảnh preview (góc ngồi trong xe, góc nhìn ra cửa, góc nhìn qua kính xe về nhà trọ) để kiểm duyệt chất lượng trước khi làm animation.

### Task 2 — Dựng Model Chi Tiết Cao & PBR Textures (Không dùng khối hộp thô)
*(Dùng skill: `blender-cinematic-production`, `character-visual-consistency`)*

> Dựa trên `docs/ASSET_CONTRACT.md`, hãy xây dựng hoặc lắp ráp (từ asset PBR miễn phí / Blender sculpting + procedural PBR baking 2K) các mesh chi tiết thực tế vào `blender/intro_master.blend`:
> 1. `Bus_Interior` (ghế bọc vải nỉ có chỉ may và độ dày, sàn cao su chống trượt có độ nhám không đều, tay vịn inox, dây nắm treo, bảng taplo phát sáng dịu, cửa kính `Bus_Door_Front` và `Bus_Door_Rear` có gioăng cao su).
> 2. `FP_Arms_Rig` (cánh tay và bàn tay giải phẫu 5 ngón thật có rig xương đầy đủ, mặc áo khoác vải có normal map; không tạo đầu/mặt).
> 3. `Bus_Driver` (tỷ lệ người thật ngồi lái ở đầu xe, không thêm hành khách thừa).
> 4. `Prop_Pouch`, `Prop_Glasses`, `Prop_Backpack` (có khóa kéo, gọng bản lề kính, nếp gấp vải tự nhiên).
> 5. `Street_Boarding_House` (nhà trọ bình dân 2 tầng tường vữa cũ, mái hiên tôn, cửa sổ rèm đèn vàng ấm, đèn hiên lối vào, xe máy dựng trước cửa, cây lá thật).
> Đặt tên toàn bộ object đúng 100% theo `docs/ASSET_CONTRACT.md` và chạy `blender --background blender/intro_master.blend --python blender/verify_contract.py` để xác nhận `[SUCCESS]`.

### Task 3 — Biên đạo Animation 40.5 giây (24fps, 972 frames) & Export GLB
*(Dùng skill: `blender-cinematic-production`, `storyboard-artist`)*

> Trong `blender/intro_master.blend`, hãy keyframe toàn bộ chuỗi 7 cảnh (frame 1–972 @ 24fps) cho `Head_Cam`, `FP_Arms_Rig`, `Prop_Pouch`, `Prop_Glasses`, `Prop_Backpack`, `Bus_Door_Front`, `Bus_Door_Rear`, và chuyển động ngoại cảnh theo đúng bảng timeline trong `docs/ASSET_CONTRACT.md`:
> - Dùng IK / `Child Of` constraint để tay nắm chặt khóa túi, gọng kính và quai ba lô, tuyệt đối không trượt, bay hay xuyên mesh.
> - Giữ chuyển động cơ thể có quán tính và trọng lượng tự nhiên, không giật camera.
> - Sau khi kiểm tra bằng `blender/verify_contract.py`, chạy:
>   `blender --background blender/intro_master.blend --python blender/export_glb.py -- public/assets/models/intro_master.glb`
> - Mở trình duyệt tại `http://localhost:5173` kiểm tra mục Asset Status hiển thị `[OK] intro_master.glb đạt đủ 100% Asset Contract` và test toàn bộ 40.5 giây intro.

### Task 4 — Nhân vật Gameplay (`huy_roommate.glb`, `vnu_jacket.glb`, `fp_gameplay_hands.glb`)
*(Dùng skill: `character-visual-consistency`, `blender-cinematic-production`)*

> Thay thế hoàn toàn mô hình ghép khối cũ của nhân vật Huy và bàn tay 2D trong game gốc:
> - Xuất `public/assets/models/huy_roommate.glb` (mô hình sinh viên giải phẫu thật, đeo kính gọng mảnh, mặt quay đúng hướng về phía trước cùng hướng tay chân, rig chuẩn với 2 clip `Sit_Idle_Typing` và `Stand_Talk_Idle`).
> - Xuất `public/assets/models/vnu_jacket.glb` (áo khoác gió xanh navy sọc trắng-xanh-trắng, chữ "ĐẠI HỌC QUỐC GIA HÀ NỘI" ở lưng).
> - Xuất `public/assets/models/fp_gameplay_hands.glb` (bàn tay 3D đồng bộ ngoại hình với `FP_Arms_Rig` trong intro).

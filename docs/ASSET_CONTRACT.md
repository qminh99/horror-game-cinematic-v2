# Asset Contract — SEGFAULT: Ngõ 165 (Blender -> Three.js)

Tài liệu này khóa chặt tên file, hệ tọa độ, tên node, tên clip hoạt ảnh và chuẩn vật liệu PBR giữa **Blender (Codex thực thi)** và **Three.js Engine (đã dựng sẵn trong `src/`)**.

## 1. Quy chuẩn chung
- **Đơn vị:** 1 unit = 1 mét thực tế (chiều cao mắt đứng ~1.63m, mắt ngồi trên ghế xe buýt ~1.32m).
- **Trục:** Export glTF chuẩn `Y-up`, `+Z` hoặc `-Z` nhất quán cho camera (dùng `Head_Cam` là Blender Camera thật để exporter tự chuyển trục).
- **Tốc độ khung hình:** `24 fps`, tổng thời lượng intro `40.5 giây` (`frame 1` đến `frame 972`).
- **Định dạng xuất:** `.glb` (nén Draco level 6, ảnh texture WebP độ phân giải 1K–2K).
- **Vật liệu:** `Principled BSDF` chuẩn PBR (`Base Color`, `Normal`, `Roughness`, `Metallic`, `AO`). **Cấm** dùng khối hộp màu bệt không texture cho bề mặt nhìn gần.

## 2. File xuất chính cho Intro: `public/assets/models/intro_master.glb`

### Bảng Node bắt buộc (đặt đúng tên tuyệt đối)
| Tên Node trong Blender | Loại | Yêu cầu chi tiết |
| :--- | :--- | :--- |
| `Head_Cam` | Camera | Camera góc nhìn thứ nhất, tiêu cự ~28–35mm (FOV ~50°). Gắn theo chuyển động tự nhiên có quán tính, tuyệt đối không xoay sang góc nhìn thứ 3 và không lộ mặt nhân vật. |
| `FP_Arms_Rig` | Armature + SkinnedMesh | Hai cánh tay & bàn tay sinh viên từ khuỷu tay đến 5 ngón có khớp thật, mặc tay áo khoác vải có Normal map. |
| `Bus_Interior` | Empty / Mesh Group | Khoang xe buýt Việt Nam buổi tối: sàn cao su vân chống trượt có vết mòn, ghế bọc nỉ/da có chỉ may & ốp lưng nhựa, tay vịn inox, dây nắm treo có lắc quán tính, cửa kính có gioăng cao su đen. |
| `Bus_Driver` | Mesh / Rig | Dáng bác tài ngồi lái ở ghế đầu (lưng/vai/bóng nghiêng tự nhiên, tay trên vô lăng). Không có hành khách thừa khác. |
| `Bus_Door_Front` | Mesh / Pivot | Cánh cửa trước mở bằng chuyển động cơ khí (xoay/gấp/trượt sát thành xe, không xuyên tường). |
| `Bus_Door_Rear` | Mesh / Pivot | Cánh cửa sau mở đối xứng cùng `Bus_Door_Front`. |
| `Prop_Pouch` | Mesh / Rig | Túi đeo đặt gần người/trên đùi có khóa kéo và miệng túi mở được (Shape Key hoặc Bone). |
| `Prop_Glasses` | Mesh | Kính cận gọng mảnh có bản lề, đệm mũi, tròng kính trong suốt. Dùng `Child Of` gắn vào tay lúc lấy ra đeo, đến frame `328` (~13.6s) áp sát trước `Head_Cam`. |
| `Prop_Backpack` | Mesh | Ba lô vải dày có độ nặng (hơi chùng dáng), đặt cạnh ghế/dưới chân. Dùng `Child Of` gắn vào tay phải khi nhấc lên để không trượt/bay. |
| `Street_Boarding_House` | Empty / Mesh Group | Mặt đường nhựa tối có độ nhám/bóng không đều, đèn đường vàng ấm, cây tán lá alpha-card, và căn nhà trọ bình dân (2 tầng, tường vữa cũ, mái hiên tôn, cửa sổ rèm hắt đèn ấm, đèn lối vào, xe máy dựng trước hiên). |
| `CeilingLight_Emissive_*` | Mesh | Tất cả chụp đèn trần trong xe (Engine tự tìm theo tiền tố để làm hiệu ứng chớp nhẹ 1 lần mỗi 8s). |
| `CeilingLight_Point_*` | PointLight | Nguồn sáng trung tính hơi ấm (~3800K–4200K) của đèn trần (Engine tự giảm 34% trong 0.16s mỗi 8s). |

### Timeline chuẩn 972 frame (`Intro_Master_40s` @ 24fps)
| Cảnh | Giây | Frame | Diễn biến Animation trong Blender |
| :--- | :--- | :--- | :--- |
| **1. Tỉnh dậy** | 0.0 – 6.5s | 1 – 156 | Ngồi trên ghế xe buýt đang chạy, đầu hơi nghiêng rồi nâng nhẹ. Xe rung nhẹ tần số thấp. Ngoại cảnh trôi mượt qua cửa kính. |
| **2. Tìm & đeo kính** | 6.5 – 15.5s | 156 – 372 | Nhìn xuống túi đeo gần người. Hai tay mở khóa kéo túi, lục tìm hơi vụng về, rút `Prop_Glasses` lên và đeo vào hai bên mắt tại ~frame 325 (13.55s). Hạ tay xuống. |
| **3. Bác tài gọi** | 15.5 – 20.5s | 372 – 492 | Hình ảnh đã rõ nét, camera nhìn thẳng lên đầu xe thấy bóng/dáng bác tài phía xa. Xe giảm tốc phanh nhẹ và dừng hẳn tại frame ~450 (18.8s), dây nắm tay đung đưa theo quán tính. |
| **4. Đứng dậy & lấy ba lô** | 20.5 – 25.5s | 492 – 612 | Nhìn xuống `Prop_Backpack`, tay phải nắm chặt quai kéo lên (có độ nặng rõ rệt) rồi đứng dậy tự nhiên khỏi ghế. |
| **5. Đi đến cửa** | 25.5 – 31.3s | 612 – 751 | Bước dọc lối giữa ra cửa với bước chân 3 trục êm ái. Ghế và tay vịn đứng yên tuyệt đối, không xuyên mesh. |
| **6. Cửa mở & xuống xe** | 31.3 – 35.8s | 751 – 859 | Dừng trước cửa. `Bus_Door_Front` & `Bus_Door_Rear` mở cơ khí (31.3–32.8s). Dừng 0.8s nhìn ra ngoài rồi bước xuống 2 bậc xe, camera hạ thấp và ổn định trên mặt đất. |
| **7. Nhìn thấy nhà trọ** | 35.8 – 40.5s | 859 – 972 | Quay đầu nhìn lại chiếc xe buýt đang đỗ; xuyên qua cửa kính xe thấy rõ căn nhà trọ bình dân có ánh đèn ấm ở cửa sổ và lối vào. Giữ khung hình tĩnh lắng đọng 2 giây cuối. |

## 3. Tài nguyên nhân vật gameplay & môi trường bổ sung
- `public/assets/models/huy_roommate.glb`: Nhân vật Huy (giải phẫu thật, mặt quay đúng hướng `-Z` theo tay chân, có 2 clip: `Sit_Idle_Typing`, `Stand_Talk_Idle`).
- `public/assets/models/vnu_jacket.glb`: Áo khoác gió VNU có nếp gấp vải thật, mặt trước có khóa kéo & logo, mặt sau có chữ "ĐẠI HỌC QUỐC GIA HÀ NỘI".
- `public/assets/models/fp_gameplay_hands.glb`: Đôi tay 3D thay cho ảnh phẳng `reaching-hand.png`.
- `public/assets/hdri/night_street_1k.hdr`: Bản đồ ánh sáng môi trường đường phố ban đêm (1K, nguồn Poly Haven).

## 4. Danh sách âm thanh thật (`public/assets/audio/`)
1. `bus_engine_loop.mp3` — Tiếng máy nổ + lốp xe nền êm.
2. `bus_interior_rattle.mp3` — Tiếng rung nhẹ nội thất xe buýt.
3. `bag_zipper_rustle.mp3` — Tiếng kéo khóa + sột soạt vải túi lúc tìm kính.
4. `glasses_clink.mp3` — Tiếng chạm nhẹ gọng kính.
5. `driver_call.mp3` — Giọng nam trung niên tự nhiên, hơi vọng khoang xe: *"Tới nơi rồi, cháu xuống xe đi."*
6. `footsteps_bus.mp3` — Tiếng bước chân trên sàn xe buýt & mặt đường.
7. `bus_door_pneumatic.mp3` — Tiếng cửa xe buýt xì hơi nén mở ra.
8. `night_street_ambience.mp3` — Không khí đường phố buổi tối yên tĩnh.
9. `ambient_pad_low.mp3` — Nền trầm cực nhỏ (tùy chọn).

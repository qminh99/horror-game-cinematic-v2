# Neighborhood Gameplay Contract (Blender -> Three.js)

Tài liệu hợp đồng kết nối giữa cảnh khu phố + nhà tập thể B1 dựng trong Blender (`blender/neighborhood_world.blend`) và hệ thống gameplay góc nhìn thứ nhất trong `src/gameplay/`.

## 1. Đường dẫn xuất file
- File GLB xuất cho gameplay: `public/assets/models/neighborhood_world.glb`
- Khi file này tồn tại, `src/main.js` tự động nạp thẳng bản Blender thay cho bản dựng sẵn (`NeighborhoodFallbackBuilder.js`).
- Không xóa `public/assets/models/intro_master.glb`; intro vẫn hoạt động khi bấm nút **XEM LẠI INTRO**.

## 2. Quy ước đặt tên Node bắt buộc
| Tiền tố / Tên Node | Chức năng trong Three.js |
| :--- | :--- |
| `SPAWN_Player` | 1 Empty đặt tại vị trí chân nhân vật (vỉa hè hoặc sân trước B1), hướng nhìn về tòa B1. |
| `WALK_*` | Mọi bề mặt đi bộ được (lòng đường, vỉa hè, ngõ đi giữa các nhà, sân B1, sàn hành lang & sàn 6 phòng B1). |
| `WALK_StairRamp_*` | Mặt dốc mượt phủ sát mép bậc thang bê tông 3 tầng B1 (Three.js tự ẩn mesh này nhưng vẫn raycast để leo cầu thang êm 60 fps). |
| `COL_*` | Các tường, lan can, vỏ ngoài các nhà hàng xóm (không cho vào), thân cây, cột đèn. |
| `COL_Proxy_*` / `COL_Bound_*` | Khối chặn vô hình (ví dụ tường chắn hai đầu phố / rào ngõ cụt); Three.js tự ẩn mesh khi render nhưng vẫn chặn va chạm. |
| `INTERACT_Door_*` | Cánh cửa mở được trong B1 (ví dụ `INTERACT_Door_201`, `INTERACT_Door_202`, `INTERACT_Door_101`...). Đặt Origin/Pivot tại trục bản lề (trục Z trong Blender). |
| `INTERACT_Switch_*` | Công tắc đèn tường cạnh cửa phòng (tùy chọn). |

## 3. Lệnh kiểm tra và xuất từ Blender (cho Codex)
```bash
blender --background blender/neighborhood_world.blend --python blender/verify_neighborhood_contract.py
blender --background blender/neighborhood_world.blend --python blender/export_neighborhood_glb.py -- public/assets/models/neighborhood_world.glb
```

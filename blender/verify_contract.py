import sys
import bpy

REQUIRED_OBJECTS = [
    'Head_Cam',
    'FP_Arms_Rig',
    'Bus_Interior',
    'Bus_Driver',
    'Bus_Door_Front',
    'Bus_Door_Rear',
    'Prop_Pouch',
    'Prop_Glasses',
    'Prop_Backpack',
    'Street_Boarding_House'
]

REQUIRED_ACTION = 'Intro_Master_40s'
CEILING_MESH_PREFIX = 'CeilingLight_Emissive_'
CEILING_LIGHT_PREFIX = 'CeilingLight_Point_'


def verify_scene():
    missing_objects = []
    for name in REQUIRED_OBJECTS:
        if bpy.data.objects.get(name) is None:
            missing_objects.append(name)

    ceiling_meshes = []
    ceiling_lights = []
    for obj in bpy.data.objects:
        if obj.type == 'MESH' and obj.name.startswith(CEILING_MESH_PREFIX):
            ceiling_meshes.append(obj.name)
        elif obj.type == 'LIGHT' and obj.name.startswith(CEILING_LIGHT_PREFIX):
            ceiling_lights.append(obj.name)

    has_action = bpy.data.actions.get(REQUIRED_ACTION) is not None
    fps = bpy.context.scene.render.fps
    frame_start = bpy.context.scene.frame_start
    frame_end = bpy.context.scene.frame_end

    print('=== BLENDER ASSET CONTRACT VERIFICATION ===')
    print('FPS:', fps, '| Frame Range:', frame_start, '->', frame_end)
    print('Ceiling Emissive Meshes:', len(ceiling_meshes))
    print('Ceiling Point Lights:', len(ceiling_lights))

    ok = True
    if len(missing_objects) > 0:
        ok = False
        print('[FAIL] Missing required objects:', ', '.join(missing_objects))
    else:
        print('[PASS] All required objects present.')

    if not has_action:
        print('[WARN] Action named "' + REQUIRED_ACTION + '" not found directly in bpy.data.actions (ensure NLA/glTF export merges into "' + REQUIRED_ACTION + '").')
    else:
        print('[PASS] Master action found:', REQUIRED_ACTION)

    if len(ceiling_meshes) == 0 and len(ceiling_lights) == 0:
        ok = False
        print('[FAIL] No ceiling lights found with prefix', CEILING_MESH_PREFIX, 'or', CEILING_LIGHT_PREFIX)
    else:
        print('[PASS] Ceiling flicker targets found.')

    if fps != 24:
        print('[WARN] Expected 24 fps, got', fps)

    if not ok:
        sys.exit(1)
    print('[SUCCESS] Scene satisfies core contract.')


if __name__ == '__main__':
    verify_scene()

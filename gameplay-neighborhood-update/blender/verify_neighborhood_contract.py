import sys
import bpy

SPAWN_NAME = 'SPAWN_Player'
WALK_PREFIX = 'WALK_'
RAMP_PREFIX = 'WALK_StairRamp_'
COL_PREFIX = 'COL_'
DOOR_PREFIX = 'INTERACT_Door_'
SWITCH_PREFIX = 'INTERACT_Switch_'


def verify_neighborhood():
    spawn = bpy.data.objects.get(SPAWN_NAME)
    walk_objs = []
    ramp_objs = []
    col_objs = []
    door_objs = []
    switch_objs = []
    light_objs = []

    for obj in bpy.data.objects:
        if obj.type == 'LIGHT':
            light_objs.append(obj.name)
        if obj.name.startswith(RAMP_PREFIX):
            ramp_objs.append(obj.name)
            walk_objs.append(obj.name)
        elif obj.name.startswith(WALK_PREFIX):
            walk_objs.append(obj.name)
        if obj.name.startswith(COL_PREFIX):
            col_objs.append(obj.name)
        if obj.name.startswith(DOOR_PREFIX):
            door_objs.append(obj.name)
        if obj.name.startswith(SWITCH_PREFIX):
            switch_objs.append(obj.name)

    print('=== NEIGHBORHOOD WORLD CONTRACT VERIFICATION ===')
    print('Spawn:', spawn.name if spawn else 'MISSING', tuple(round(v, 2) for v in spawn.location) if spawn else '')
    print('WALK_* meshes:', len(walk_objs), '(including StairRamps:', len(ramp_objs), ')')
    print('COL_* colliders:', len(col_objs))
    print('INTERACT_Door_*:', len(door_objs))
    print('INTERACT_Switch_*:', len(switch_objs))
    print('Dynamic Lights:', len(light_objs))

    ok = True
    if spawn is None:
        ok = False
        print('[FAIL] Missing required Empty:', SPAWN_NAME)
    else:
        print('[PASS] Spawn node found.')

    if len(walk_objs) == 0:
        ok = False
        print('[FAIL] No walkable surfaces with prefix', WALK_PREFIX)
    else:
        print('[PASS] Walkable surfaces found.')

    if len(col_objs) == 0:
        ok = False
        print('[FAIL] No colliders with prefix', COL_PREFIX)
    else:
        print('[PASS] Colliders found.')

    if len(door_objs) == 0:
        print('[WARN] No interactive doors found with prefix', DOOR_PREFIX)

    if len(light_objs) > 10:
        print('[WARN] More than 10 dynamic lights may reduce browser FPS:', len(light_objs))

    if not ok:
        sys.exit(1)
    print('[SUCCESS] Neighborhood world satisfies gameplay contract.')


if __name__ == '__main__':
    verify_neighborhood()

import os
import sys
import bpy


def get_output_path():
    argv = sys.argv
    if '--' in argv:
        extra = argv[argv.index('--') + 1:]
        if len(extra) > 0:
            return os.path.abspath(extra[0])
    return os.path.abspath('public/assets/models/intro_master.glb')


def export_cinematic_glb():
    output_path = get_output_path()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_yup=True,
        export_cameras=True,
        export_lights=True,
        export_animations=True,
        export_animation_mode='SCENE',
        export_merge_animation='SCENE',
        export_nla_strips_merged_animation_name='Intro_Master_40s',
        export_frame_range=True,
        export_frame_step=1,
        export_force_sampling=True,
        export_skins=True,
        export_morph=True,
        export_materials='EXPORT',
        export_image_format='WEBP',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6
    )
    print('Exported GLB to:', output_path)


if __name__ == '__main__':
    export_cinematic_glb()

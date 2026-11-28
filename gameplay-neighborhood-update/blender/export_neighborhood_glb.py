import os
import sys
import bpy


def get_output_path():
    argv = sys.argv
    if '--' in argv:
        extra = argv[argv.index('--') + 1:]
        if len(extra) > 0:
            return os.path.abspath(extra[0])
    return os.path.abspath('public/assets/models/neighborhood_world.glb')


def prepare_web_materials():
    for material in bpy.data.materials:
        tree = material.node_tree
        if not tree:
            continue
        shader = next((n for n in tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not shader:
            continue
        transmission = shader.inputs.get('Transmission Weight') or shader.inputs.get('Transmission')
        if transmission and transmission.default_value > 0:
            transmission.default_value = 0.0
            shader.inputs['Alpha'].default_value = 0.22
            material.surface_render_method = 'BLENDED'
        color = shader.inputs.get('Base Color')
        if color and color.is_linked and color.links[0].from_node.type == 'VALTORGB':
            ramp = color.links[0].from_node.color_ramp
            color.default_value = ramp.evaluate(0.5)
            tree.links.remove(color.links[0])


def export_neighborhood():
    output_path = get_output_path()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    prepare_web_materials()

    for light in bpy.data.lights:
        if getattr(light, 'use_temperature', False):
            rgb = [a * b for a, b in zip(light.color, light.temperature_color)]
            gain = max(1.0, *rgb)
            light.use_temperature = False
            light.color = [channel / gain for channel in rgb]
            light.energy *= gain

    bpy.context.scene.render.engine = 'BLENDER_EEVEE'
    for obj in bpy.context.scene.objects:
        is_preview_cam = obj.type == 'CAMERA'
        is_area_light = obj.type == 'LIGHT' and obj.data.type == 'AREA'
        obj.select_set(not (is_preview_cam or is_area_light))

    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_yup=True,
        export_cameras=False,
        export_lights=True,
        export_import_convert_lighting_mode='COMPAT',
        export_animations=False,
        use_selection=True,
        export_materials='EXPORT',
        export_image_format='WEBP',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6
    )
    print('Exported Neighborhood GLB to:', output_path)


if __name__ == '__main__':
    export_neighborhood()

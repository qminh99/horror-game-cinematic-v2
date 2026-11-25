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


def bake_facade_color(material, shader):
    """Project the lookdev plaster across the modular walls in the parked pose."""
    scene = bpy.context.scene
    parked_frame = scene.frame_current
    scene.frame_set(451)
    front = bpy.data.objects['Spandrel'].matrix_world.translation.x
    center = bpy.data.objects['Street_Boarding_House'].matrix_world.translation.y
    width, height = 13.2, 10.0
    corner = (front, center - width / 2, -0.65)
    mesh = bpy.data.meshes.new('Facade bake surface')
    mesh.from_pydata([(front, corner[1] + width * u, corner[2] + height * v)
                      for u, v in [(0, 0), (1, 0), (1, 1), (0, 1)]], [], [(0, 1, 2, 3)])
    surface = bpy.data.objects.new(mesh.name, mesh)
    scene.collection.objects.link(surface)
    mesh.materials.append(material)
    uv = mesh.uv_layers.new()
    for loop, coord in zip(uv.data, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        loop.uv = coord

    tree = material.node_tree
    output = next(n for n in tree.nodes if n.type == 'OUTPUT_MATERIAL' and n.is_active_output)
    color = shader.inputs['Base Color']
    source = color.links[0].from_socket
    image = bpy.data.images.new('B1 weathered render • facade', width=2048, height=1024, alpha=False)
    target = tree.nodes.new('ShaderNodeTexImage')
    target.image = image
    tree.nodes.active = target
    emission = tree.nodes.new('ShaderNodeEmission')
    tree.links.new(source, emission.inputs['Color'])
    tree.links.new(emission.outputs[0], output.inputs['Surface'])
    bpy.ops.object.select_all(action='DESELECT')
    surface.select_set(True)
    bpy.context.view_layer.objects.active = surface
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 1
    bpy.ops.object.bake(type='EMIT', margin=2)
    image.pack()
    tree.links.new(shader.outputs[0], output.inputs['Surface'])
    tree.links.new(target.outputs['Color'], color)
    bpy.data.objects.remove(surface, do_unlink=True)
    bpy.data.meshes.remove(mesh)

    # World-continuous UVs keep the stains aligned across lintels and courses.
    for obj in scene.objects:
        if obj.type != 'MESH' or material not in obj.data.materials[:]:
            continue
        mesh = obj.data
        if mesh.users > 1:
            mesh = obj.data = mesh.copy()
        uv = mesh.uv_layers.active or mesh.uv_layers.new()
        points = [obj.matrix_world @ v.co for v in mesh.vertices]
        for face in mesh.polygons:
            if mesh.materials[face.material_index] != material:
                continue
            for index in face.loop_indices:
                point = points[mesh.loops[index].vertex_index]
                along = point.y - corner[1] if abs(face.normal.x) >= abs(face.normal.y) else point.x - front
                uv.data[index].uv = (along / width, (point.z - corner[2]) / height)
    scene.frame_set(parked_frame)


def prepare_web_materials():
    # The glTF exporter cannot interpret Cycles noise ramps or Fresnel shader mixes.
    for material in bpy.data.materials:
        tree = material.node_tree
        if not tree:
            continue
        shader = next((n for n in tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not shader:
            continue
        color = shader.inputs['Base Color']
        if material.name.startswith('Laminated glass'):
            output = next(n for n in tree.nodes if n.type == 'OUTPUT_MATERIAL' and n.is_active_output)
            tree.links.new(shader.outputs[0], output.inputs['Surface'])
            shader.inputs['Alpha'].default_value = 0.065
            shader.inputs['Roughness'].default_value = 0.19
            material.surface_render_method = 'BLENDED'
        elif material.name.startswith('B1 | Worn'):
            bake_facade_color(material, shader)
        elif color.is_linked and color.links[0].from_node.type == 'VALTORGB':
            ramp = color.links[0].from_node.color_ramp
            color.default_value = ramp.evaluate(0.5)
            tree.links.remove(color.links[0])
        roughness = shader.inputs['Roughness']
        if roughness.is_linked and roughness.links[0].from_node.type != 'TEX_IMAGE':
            tree.links.remove(roughness.links[0])
            if material.name.startswith('Student 61950'):
                roughness.default_value = 0.55


def export_cinematic_glb():
    output_path = get_output_path()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    prepare_web_materials()
    # Three.js uses unit exposure. Match the scene's inverse-square lighting
    # and move any blackbody RGB gain above 1 into the punctual light intensity.
    for light in bpy.data.lights:
        if light.use_temperature:
            rgb = [a * b for a, b in zip(light.color, light.temperature_color)]
            gain = max(1.0, *rgb)
            light.use_temperature = False
            light.color = [channel / gain for channel in rgb]
            light.energy *= gain
    bpy.context.scene.render.engine = 'BLENDER_EEVEE'
    # SCENE mode names the combined clip after the Blender scene.
    for obj in bpy.context.scene.objects:
        preview_camera = obj.type == 'CAMERA' and obj != bpy.context.scene.camera
        studio_light = obj.type == 'LIGHT' and obj.data.type == 'AREA'
        obj.select_set(not (preview_camera or studio_light))
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_yup=True,
        export_cameras=True,
        export_lights=True,
        export_import_convert_lighting_mode='COMPAT',
        export_animations=True,
        export_animation_mode='SCENE',
        export_anim_scene_split_object=False,
        use_selection=True,
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

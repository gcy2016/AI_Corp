# 树皮管线验证（#22）

```bash
python3 -m venv bl && ./bl/bin/pip install bpy==5.2.2      # Blender 作为 Python 模块
python3 maketex.py                                          # 临时树皮贴图（真贴图到了就不用）
./bl/bin/python bark.py                                     # 渲染 render-bark.png
./bl/bin/python bark.py <贴图前缀> <hdri 文件>             # 换成 Poly Haven 贴图和 HDRI
```

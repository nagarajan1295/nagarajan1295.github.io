# Rebuilds ../index.html by inlining curves.json into index.template.html
import pathlib
d=pathlib.Path(__file__).parent
t=(d/"index.template.html").read_text(encoding="utf-8"); c=(d/"curves.json").read_text(encoding="utf-8")
(d.parent/"index.html").write_text(t.replace("/*CURVES*/",c),encoding="utf-8"); print("built index.html")

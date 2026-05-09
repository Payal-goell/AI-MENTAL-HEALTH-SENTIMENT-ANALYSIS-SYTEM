import json
import codecs

for nb in ['d:/MindCare-AI/Step4_VR.ipynb', 'd:/MindCare-AI/working.ipynb']:
    try:
        with codecs.open(nb, 'r', 'utf-8') as f:
            d = json.load(f)
        
        source_code = []
        for c in d.get('cells', []):
            if c['cell_type'] == 'code':
                source_code.append(''.join(c.get('source', [])))
        
        with codecs.open(nb.replace('.ipynb', '_source.py'), 'w', 'utf-8') as f:
            f.write('\n'.join(source_code))
    except Exception as e:
        print(f"Error processing {nb}: {e}")

import pandas as pd
import numpy as np

Y = []
# RAVDESS integers:
Y.extend([1, 2, 3, 4, 5, 6, 7, 8])
# CREMA-D:
Y.extend(['sad', 'angry', 'disgust', 'fear', 'happy', 'neutral', 'Unknown'])
# TESS & SAVEE:
Y.extend(['surprise', 'angry', 'disgust', 'fear', 'happy', 'neutral', 'sad'])

from sklearn.preprocessing import OneHotEncoder
encoder = OneHotEncoder()
enc_out = encoder.fit_transform(np.array(Y).reshape(-1,1)).toarray()
print("Categories:")
print(list(encoder.categories_[0]))

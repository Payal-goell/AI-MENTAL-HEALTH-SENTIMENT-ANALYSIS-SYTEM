import numpy as np
from sklearn.preprocessing import OneHotEncoder

# Simulate the exact values pushed to file_emotion
Y = []
# RAVDESS parts
Y.extend([1, 2, 3, 4, 5, 6, 7, 8])
# CREMA-D / TESS / SAVEE parts
Y.extend(['sad', 'angry', 'disgust', 'fear', 'happy', 'neutral', 'surprise'])

encoder = OneHotEncoder()
Y_transformed = encoder.fit_transform(np.array(Y).reshape(-1,1)).toarray()

print("OneHotEncoder Categories:")
print(list(encoder.categories_[0]))

import pandas as pd
import numpy as np
import os, sys

import librosa
import librosa.display
import seaborn as sns
import matplotlib.pyplot as plt

from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import confusion_matrix, classification_report
from sklearn.model_selection import train_test_split

import IPython.display as ipd
from IPython.display import Audio

import keras
from keras.models import Sequential, Model
from keras.layers import *
from keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import tensorflow as tf

import warnings
warnings.filterwarnings("ignore")
print("Done")

# !apt-get update
# !apt-get install -y libsndfile1

!ls "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER"

# RAVDESS
!unzip "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/RAVDESS Emotional speech audio.zip" \
-d "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/RAVDESS"

# CREMA-D
!unzip "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/CREMA-D.zip" \
-d "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/CREMA-D"

# TESS
!unzip "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/Toronto emotional speech set (TESS).zip" \
-d "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/TESS"

# SAVEE
!unzip "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/Surrey Audio-Visual Expressed Emotion (SAVEE).zip" \
-d "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/SAVEE"

!ls "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/RAVDESS"
!ls "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/CREMA-D"
!ls "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/TESS"

!ls "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/SAVEE"

import os
print(len(os.listdir("/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/RAVDESS")))  # should print 24
print(len(os.listdir("/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/CREMA-D")))
print(len(os.listdir("/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/TESS")))
print(len(os.listdir("/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/SAVEE")))

ravdess = "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/RAVDESS/"
Crema   = "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/CREMA-D/AudioWAV/"
Tess    = "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/TESS/TESS Toronto emotional speech set data/"
Savee   = "/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/SAVEE/ALL/"

ravdess_directory_list = os.listdir(ravdess)

file_emotion = []
file_path = []

for i in ravdess_directory_list:
    actor_path = os.path.join(ravdess, i)

    if not os.path.isdir(actor_path):
        continue

    actor_files = os.listdir(actor_path)

    for f in actor_files:
        # process ONLY wav files
        if not f.endswith(".wav"):
            continue

        part = f.split('.')[0].split('-')

        # safety check (must have at least 3 parts)
        if len(part) < 3:
            continue

        file_emotion.append(int(part[2]))
        file_path.append(os.path.join(actor_path, f))

print(len(file_emotion))
print(len(file_path))
print(file_path[:3])


file_emotion=[]
file_path=[]

for file in os.listdir(Crema):
    file_path.append(Crema + file)
    part=file.split('_')
    if part[2]=='SAD': file_emotion.append('sad')
    elif part[2]=='ANG': file_emotion.append('angry')
    elif part[2]=='DIS': file_emotion.append('disgust')
    elif part[2]=='FEA': file_emotion.append('fear')
    elif part[2]=='HAP': file_emotion.append('happy')
    elif part[2]=='NEU': file_emotion.append('neutral')
    else: file_emotion.append('Unknown')

Crema_df = pd.concat([
    pd.DataFrame(file_emotion, columns=['Emotions']),
    pd.DataFrame(file_path, columns=['Path'])
], axis=1)

print(len(file_emotion))
print(len(file_path))
print(file_path[:3])

# ravdess_df = pd.concat([
#     pd.DataFrame(file_emotion, columns=['Emotions']),
#     pd.DataFrame(file_path, columns=['Path'])
# ], axis=1)

# ravdess_df.Emotions.replace({
#     1:'neutral',2:'neutral',3:'happy',4:'sad',
#     5:'angry',6:'fear',7:'disgust',8:'surprise'
# }, inplace=True)

file_emotion=[]
file_path=[]

for dir in os.listdir(Tess):
    for file in os.listdir(Tess + dir):
        part=file.split('.')[0].split('_')[2]
        file_emotion.append('surprise' if part=='ps' else part)
        file_path.append(Tess + dir + '/' + file)

Tess_df = pd.concat([
    pd.DataFrame(file_emotion, columns=['Emotions']),
    pd.DataFrame(file_path, columns=['Path'])
], axis=1)

print(len(file_emotion))
print(len(file_path))
print(file_path[:3])

file_emotion=[]
file_path=[]

for file in os.listdir(Savee):
    file_path.append(Savee + file)
    ele=file.split('_')[1][:-6]
    if ele=='a': file_emotion.append('angry')
    elif ele=='d': file_emotion.append('disgust')
    elif ele=='f': file_emotion.append('fear')
    elif ele=='h': file_emotion.append('happy')
    elif ele=='n': file_emotion.append('neutral')
    elif ele=='sa': file_emotion.append('sad')
    else: file_emotion.append('surprise')

Savee_df = pd.concat([
    pd.DataFrame(file_emotion, columns=['Emotions']),
    pd.DataFrame(file_path, columns=['Path'])
], axis=1)

print(len(file_emotion))
print(len(file_path))
print(file_path[:3])

data_path = pd.concat([ravdess_df, Crema_df, Tess_df, Savee_df], axis=0)
data_path.to_csv("data_path.csv", index=False)

def zcr(data):
    return np.squeeze(librosa.feature.zero_crossing_rate(y=data))

def rmse_feat(data):
    return np.squeeze(librosa.feature.rms(y=data))

def mfcc(data, sr):
    return np.ravel(librosa.feature.mfcc(y=data, sr=sr).T)

def extract_features(data, sr):
    return np.hstack((
        zcr(data),
        rmse_feat(data),
        mfcc(data, sr)
    ))

def pitch(data, sr):
    return librosa.effects.pitch_shift(
        y=data,
        sr=sr,
        n_steps=0.7
    )

def get_features(path):
    data, sr = librosa.load(path, duration=2.5, offset=0.6)
    return np.vstack([
        extract_features(data, sr),
        extract_features(noise(data), sr),
        extract_features(pitch(data, sr), sr),
        extract_features(noise(pitch(data, sr)), sr)
    ])

from tqdm import tqdm

X, Y = [], []

for p, e in tqdm(zip(data_path.Path, data_path.Emotions), total=len(data_path)):
    feats = get_features(p)
    for f in feats:
        X.append(f)
        Y.append(e)
print(len(X), len(Y))
print(X[0].shape)

# import pickle

# with open("X_features.pkl", "wb") as f:
#     pickle.dump(X, f)

# with open("Y_labels.pkl", "wb") as f:
#     pickle.dump(Y, f)

import pickle
with open("/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/X_features.pkl", "rb") as f:
    X = pickle.load(f)

with open("/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/Y_labels.pkl", "rb") as f:
    Y = pickle.load(f)

lengths = [len(f) for f in X]
print(min(lengths), max(lengths))

def fix_feature_length(X, target_len=2376):
    X_fixed = []
    for f in X:
        if len(f) > target_len:
            X_fixed.append(f[:target_len])
        elif len(f) < target_len:
            X_fixed.append(
                np.pad(f, (0, target_len - len(f)), mode='constant')
            )
        else:
            X_fixed.append(f)
    return np.array(X_fixed)

X = fix_feature_length(X)
print(X.shape)   # should be (samples, 2376)


from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split

encoder = OneHotEncoder()
Y = encoder.fit_transform(np.array(Y).reshape(-1,1)).toarray()

x_train, x_test, y_train, y_test = train_test_split(
    X, Y, test_size=0.2, random_state=42
)

scaler = StandardScaler()
x_train = scaler.fit_transform(x_train)
x_test = scaler.transform(x_test)

x_traincnn = np.expand_dims(x_train, 2)
x_testcnn  = np.expand_dims(x_test, 2)

print(x_traincnn.shape)
print(y_train.shape)

model=tf.keras.Sequential([
    Conv1D(512,5,padding='same',activation='relu',input_shape=(x_traincnn.shape[1],1)),
    BatchNormalization(),MaxPooling1D(5,2,padding='same'),
    Conv1D(512,5,padding='same',activation='relu'),
    BatchNormalization(),MaxPooling1D(5,2,padding='same'),Dropout(0.2),
    Conv1D(256,5,padding='same',activation='relu'),
    BatchNormalization(),MaxPooling1D(5,2,padding='same'),
    Conv1D(256,3,padding='same',activation='relu'),
    BatchNormalization(),MaxPooling1D(5,2,padding='same'),Dropout(0.2),
    Conv1D(128,3,padding='same',activation='relu'),
    BatchNormalization(),MaxPooling1D(3,2,padding='same'),Dropout(0.2),
    Flatten(),
    Dense(512,activation='relu'),
    BatchNormalization(),
    Dense(7,activation='softmax')
])

model.compile(optimizer='adam',loss='categorical_crossentropy',metrics=['accuracy'])

chk=ModelCheckpoint("best_model1_weights.h5",monitor='val_accuracy',save_best_only=True)
early=EarlyStopping(monitor='val_accuracy',patience=5,restore_best_weights=True)
lr=ReduceLROnPlateau(monitor='val_accuracy',patience=3,factor=0.5)

history=model.fit(
    x_traincnn,y_train,
    epochs=50,batch_size=64,
    validation_data=(x_testcnn,y_test),
    callbacks=[chk,early,lr]
)

# Predictions
pred_test = model.predict(x_testcnn)

y_pred0 = encoder.inverse_transform(pred_test)
y_test0 = encoder.inverse_transform(y_test)

from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd

cm = confusion_matrix(y_test0, y_pred0)

plt.figure(figsize=(12,10))
cm = pd.DataFrame(
    cm,
    index=encoder.categories_[0],
    columns=encoder.categories_[0]
)

sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', linewidths=1)
plt.title("Confusion Matrix", size=18)
plt.xlabel("Predicted Labels")
plt.ylabel("True Labels")
plt.show()

print(classification_report(y_test0, y_pred0))

from tensorflow.keras.models import model_from_json

# Save model architecture
model_json = model.to_json()
with open("/content/CNN_model.json", "w") as json_file:
    json_file.write(model_json)

# Save weights (IMPORTANT: .weights.h5)
model.save_weights("/content/CNN_model.weights.h5")

print("✅ Model saved to disk")

from tensorflow.keras.models import model_from_json

with open("/content/CNN_model.json", "r") as json_file:
    loaded_model_json = json_file.read()

loaded_model = model_from_json(loaded_model_json)
loaded_model.load_weights("/content/CNN_model.weights.h5")

loaded_model.compile(
    optimizer="adam",
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

print("✅ Model loaded successfully")

import pickle

# Save
with open("/content/scaler2.pickle", "wb") as f:
    pickle.dump(scaler, f)

with open("/content/encoder2.pickle", "wb") as f:
    pickle.dump(encoder, f)

print("✅ Scaler & Encoder saved")

# Load
with open("/content/scaler2.pickle", "rb") as f:
    scaler2 = pickle.load(f)

with open("/content/encoder2.pickle", "rb") as f:
    encoder2 = pickle.load(f)

print("✅ Scaler & Encoder loaded")

import librosa
import numpy as np

def zcr(data):
    return np.squeeze(librosa.feature.zero_crossing_rate(y=data))

def rmse_feat(data):
    return np.squeeze(librosa.feature.rms(y=data))

def mfcc(data, sr):
    return np.ravel(librosa.feature.mfcc(y=data, sr=sr).T)

def extract_features(data, sr):
    return np.hstack((
        zcr(data),
        rmse_feat(data),
        mfcc(data, sr)
    ))

def get_predict_feat(path):
    data, sr = librosa.load(path, duration=2.5, offset=0.6)

    features = extract_features(data, sr)

    # FIX LENGTH (must be same as training)
    if len(features) > 2376:
        features = features[:2376]
    else:
        features = np.pad(features, (0, 2376 - len(features)))

    features = features.reshape(1, -1)
    features = scaler2.transform(features)
    features = np.expand_dims(features, axis=2)

    return features

def prediction(path):
    feat = get_predict_feat(path)
    pred = loaded_model.predict(feat)
    emotion = encoder2.inverse_transform(pred)
    print("Predicted Emotion:", emotion[0][0])

prediction(
"/content/drive/MyDrive/MCA/Main Project/Project_Code/Step4_VER/CREMA-D/AudioWAV/1001_DFA_SAD_XX.wav"
)

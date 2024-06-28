import cv2

def list_video_devices():
    # This function will attempt to list all available video devices and their titles.
    index = 0
    arr = []
    while True:
        cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
        if not cap.read()[0]:
            break
        else:
            arr.append(index)
        cap.release()
        index += 1
    return arr

def get_device_name(index):
    cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
    if not cap.isOpened():
        return None
    backend_name = cap.getBackendName()
    cap.release()
    return backend_name

if __name__ == "__main__":
    devices = list_video_devices()
    print("Found devices:")
    for i, device in enumerate(devices):
        name = get_device_name(device)
        print(f"Device {i}: Index {device}, Name: {name}")

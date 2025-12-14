import requests
import os

# Create images directory if it doesn't exist
os.makedirs('images', exist_ok=True)

# List of Pexels image URLs (these are free to use images)
image_urls = {
    'hero': 'https://images.pexels.com/photos/159657/house-painter-repair-home-improvement-159657.jpeg',
    'carpentry': 'https://images.pexels.com/photos/6994688/pexels-photo-6994688.jpeg',
    'electrical': 'https://images.pexels.com/photos/6994685/pexels-photo-6994685.jpeg',
    'plumbing': 'https://images.pexels.com/photos/6994687/pexels-photo-6994687.jpeg',
    'painting': 'https://images.pexels.com/photos/6994686/pexels-photo-6994686.jpeg',
    'drywall': 'https://images.pexels.com/photos/6994689/pexels-photo-6994689.jpeg',
    'general_repair': 'https://images.pexels.com/photos/6994690/pexels-photo-6994690.jpeg',
    'portfolio1': 'https://images.pexels.com/photos/1643457/pexels-photo-1643457.jpeg',
    'portfolio2': 'https://images.pexels.com/photos/2678809/pexels-photo-2678809.jpeg',
    'portfolio3': 'https://images.pexels.com/photos/6994691/pexels-photo-6994691.jpeg',
    'about': 'https://images.pexels.com/photos/4164053/pexels-photo-4164053.jpeg'
}

def download_image(url, filename):
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        filepath = os.path.join('images', filename)
        with open(filepath, 'wb') as f:
            f.write(response.content)
        print(f'Downloaded: {filename}')
    except Exception as e:
        print(f'Error downloading {filename}: {e}')

# Download all images
for key, url in image_urls.items():
    # Extract filename from URL
    filename = url.split('/')[-1]
    if '?' in filename:
        filename = filename.split('?')[0]
    
    # Add appropriate extension if missing
    if not filename.endswith(('.jpg', '.jpeg', '.png', '.webp')):
        filename += '.jpg'
    
    download_image(url, filename)
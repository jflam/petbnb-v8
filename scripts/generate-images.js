const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

// Load seed data with image prompts
const sitterData = require('./seed-data/sitters.json');
const ownerData = require('./seed-data/owners.json');

async function generateImage(prompt, filename) {
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: `Studio Ghibli style illustration: ${prompt}. Soft watercolor aesthetic, gentle lighting, whimsical and heartwarming atmosphere, detailed background, character portrait.`,
        size: "1024x1024",
        quality: "standard",
        n: 1
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;
    
    // Download and save the image
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.buffer();
    
    const outputPath = path.join(__dirname, '../public/images/profiles', filename);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, buffer);
    
    console.log(`Generated image: ${filename}`);
    return `/images/profiles/${filename}`;
  } catch (error) {
    console.error(`Failed to generate image for ${filename}:`, error.message);
    return null;
  }
}

async function generateAllImages() {
  console.log('Starting Studio Ghibli image generation...');
  
  // Generate sitter images
  console.log(`\nGenerating images for ${sitterData.length} sitters...`);
  for (const sitter of sitterData) {
    const filename = `sitter-${sitter.id}.jpg`;
    const imageUrl = await generateImage(sitter.imagePrompt, filename);
    sitter.profilePicture = imageUrl || '/images/placeholder-sitter.jpg';
    
    // Add a small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Generate owner images
  console.log(`\nGenerating images for ${ownerData.length} owners...`);
  for (const owner of ownerData) {
    const filename = `owner-${owner.id}.jpg`;
    const imageUrl = await generateImage(owner.imagePrompt, filename);
    owner.profilePicture = imageUrl || '/images/placeholder-owner.jpg';
    
    // Add a small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Save updated data with image URLs
  await fs.writeFile(
    path.join(__dirname, './seed-data/sitters-with-images.json'),
    JSON.stringify(sitterData, null, 2)
  );
  
  await fs.writeFile(
    path.join(__dirname, './seed-data/owners-with-images.json'),
    JSON.stringify(ownerData, null, 2)
  );
  
  console.log('\nImage generation complete! Data saved to sitters-with-images.json and owners-with-images.json');
}

// Check if OPENAI_API_KEY is set
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set');
  console.log('Please set it in your .env file or export it:');
  console.log('export OPENAI_API_KEY="your-api-key"');
  process.exit(1);
}

generateAllImages().catch(console.error);
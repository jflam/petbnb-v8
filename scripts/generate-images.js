const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

// Load seed data with image prompts
const sitterData = require('./seed-data/sitters.json');
const ownerData = require('./seed-data/owners.json');

async function generateImage(prompt, filename) {
  try {
    console.log(`Generating image: ${filename}`);
    
    const requestBody = {
      model: "gpt-image-1",
      prompt: `Studio Ghibli style illustration: ${prompt}. Soft watercolor aesthetic, gentle lighting, whimsical and heartwarming atmosphere, detailed background, character portrait.`,
      size: "1024x1024",
      quality: "high",
      n: 1
    };
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Response data structure:', Object.keys(data.data[0]));
    
    let buffer;
    
    // Check if response contains base64 data or URL
    if (data.data[0].b64_json) {
      // Handle base64 response
      const imageBase64 = data.data[0].b64_json;
      buffer = Buffer.from(imageBase64, 'base64');
    } else if (data.data[0].url) {
      // Handle URL response - need to download the image
      const imageUrl = data.data[0].url;
      console.log('Downloading from URL:', imageUrl);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }
      buffer = await imageResponse.buffer();
    } else {
      throw new Error('Unexpected response format from API');
    }
    
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
  
  // Check for existing generated data files
  const sittersWithImagesPath = path.join(__dirname, './seed-data/sitters-with-images.json');
  const ownersWithImagesPath = path.join(__dirname, './seed-data/owners-with-images.json');
  
  // Load existing data if available
  let existingSittersData = {};
  let existingOwnersData = {};
  
  try {
    if (await fs.access(sittersWithImagesPath).then(() => true).catch(() => false)) {
      const data = JSON.parse(await fs.readFile(sittersWithImagesPath, 'utf8'));
      existingSittersData = Object.fromEntries(data.map(s => [s.id || s.email, s]));
      console.log(`Found existing sitters data with ${Object.keys(existingSittersData).length} entries`);
    }
  } catch (error) {
    console.log('No existing sitters data found');
  }
  
  try {
    if (await fs.access(ownersWithImagesPath).then(() => true).catch(() => false)) {
      const data = JSON.parse(await fs.readFile(ownersWithImagesPath, 'utf8'));
      existingOwnersData = Object.fromEntries(data.map(o => [o.id || o.email, o]));
      console.log(`Found existing owners data with ${Object.keys(existingOwnersData).length} entries`);
    }
  } catch (error) {
    console.log('No existing owners data found');
  }
  
  // Generate sitter images
  console.log(`\nProcessing ${sitterData.length} sitters...`);
  let sittersGenerated = 0;
  let sittersSkipped = 0;
  
  for (const sitter of sitterData) {
    const filename = `sitter-${sitter.id}.jpg`;
    const imagePath = path.join(__dirname, '../public/images/profiles', filename);
    
    // Check if image already exists on disk
    const imageExists = await fs.access(imagePath).then(() => true).catch(() => false);
    
    if (imageExists && existingSittersData[sitter.id || sitter.email]?.profilePicture) {
      // Image exists and we have the URL in our data
      console.log(`✓ Skipping ${filename} (already exists)`);
      sitter.profilePicture = existingSittersData[sitter.id || sitter.email].profilePicture;
      sittersSkipped++;
    } else {
      // Generate new image
      const imageUrl = await generateImage(sitter.imagePrompt, filename);
      sitter.profilePicture = imageUrl || '/images/placeholder-sitter.jpg';
      sittersGenerated++;
      
      // Add a small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Generate owner images
  console.log(`\nProcessing ${ownerData.length} owners...`);
  let ownersGenerated = 0;
  let ownersSkipped = 0;
  
  for (const owner of ownerData) {
    const filename = `owner-${owner.id}.jpg`;
    const imagePath = path.join(__dirname, '../public/images/profiles', filename);
    
    // Check if image already exists on disk
    const imageExists = await fs.access(imagePath).then(() => true).catch(() => false);
    
    if (imageExists && existingOwnersData[owner.id || owner.email]?.profilePicture) {
      // Image exists and we have the URL in our data
      console.log(`✓ Skipping ${filename} (already exists)`);
      owner.profilePicture = existingOwnersData[owner.id || owner.email].profilePicture;
      ownersSkipped++;
    } else {
      // Generate new image
      const imageUrl = await generateImage(owner.imagePrompt, filename);
      owner.profilePicture = imageUrl || '/images/placeholder-owner.jpg';
      ownersGenerated++;
      
      // Add a small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
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
  
  console.log('\nImage generation complete!');
  console.log(`Sitters: ${sittersGenerated} generated, ${sittersSkipped} skipped`);
  console.log(`Owners: ${ownersGenerated} generated, ${ownersSkipped} skipped`);
  console.log('Data saved to sitters-with-images.json and owners-with-images.json');
}

// Check if OPENAI_API_KEY is set
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set');
  console.log('Please set it in your .env file or export it:');
  console.log('export OPENAI_API_KEY="your-api-key"');
  process.exit(1);
}

generateAllImages().catch(console.error);
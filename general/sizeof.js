//adiyodi.snippets1001/general/sizeof.js
////Revisions:
// created 2024 July, Veenus Adiyodi - Caution this is simple estimation function which doesnot do much with actual memory footprint. 
// However if you modify these size values based on your platform, you can easily use without much complication.
function sizeof(obj) {
    // Initialize variable for total size
    let size = 0;

    // Iterate through object properties
    for (const key in obj) {
        // Check property type and add estimated size
        switch (typeof obj[key]) {
            case "string":
                size += obj[key].length * 2; // Assuming 2 bytes per character
                break;
            case "number":
                size += 8; // Assuming 8 bytes for doubles
                break;
            case "boolean":
                size += 4; // Assuming 4 bytes for booleans (may vary)
                break;
            case "object":
                // If nested object, call recursively (limited depth for browsers)
                if (obj[key] !== null) {
                    size += sizeof(obj[key]);
                }
                break;
        }
    }
    return size;
}

sizeof_test_1() {
    // Create a sample object
    const myObject = {
        name: "John Doe",
        age: 30,
        isActive: true,
        hobbies: ["coding", "reading"]
    };

    // Calculate and display object size (estimate)
    const size = sizeof(myObject);
    console.log(`Estimated object size: ${size} bytes`);
}
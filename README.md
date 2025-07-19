# AI_Image_Prompt_Editor - User Manual

## Getting Started

**First, open AI_Image_Prompt_Editor.html, then click the "Load Keywords" button to load the Initial_setting_keywords file.**
You can select the strength of keywords, change the order, and display in multiple languages.
You can save the keywords and display presets you use,
so you can change the situation while maintaining the basic settings.

<img width="2369" height="1734" alt="sample2" src="https://github.com/user-attachments/assets/50eaa537-9275-47ac-9461-ad2804502fea" />

<img width="2422" height="1732" alt="sample1" src="https://github.com/user-attachments/assets/7085b16b-7462-4eab-9a48-6d57b86d9264" />

This file contains basic keyword data that is required to use the tool.

## Overview
AI Image Prompt Editor is a comprehensive tool for creating and managing AI image generation prompts. It features advanced keyword management, emphasis controls, preset saving/loading, and drag-and-drop category organization.

## Features

### 1. Keyword Management
- **Load Keywords**: Import keyword data from JSON files (settings are also restored)
- **Save Keywords**: Export all keyword data and settings to JSON files with timestamps
- **Add Keywords**: Create new keywords with categories, descriptions, and multiple variations
- **Delete Keywords**: Remove keywords with confirmation dialogs
- **Edit Keywords**: Double-click to edit key names and descriptions
- **Description Display Control**: Toggle keyword description visibility with "Show desc" checkbox

### 2. Emphasis Control
- **Strengthening**: Use `+` button to increase emphasis (up to 2.0x)
- **Weakening**: Use `-` button to decrease emphasis (down to 1.0x)
- **Format**: Keywords are formatted as `(keyword:1.2)` for strengthening or `[keyword:1.2]` for weakening

### 3. Preset Management
- **Save Presets**: Save current keyword selections with emphasis settings
- **Load Presets**: Load previously saved keyword configurations
- **Auto-registration**: Missing keywords and categories are automatically added when loading presets

### 4. Category Organization
- **Drag and Drop**: Reorder categories within Prompt and Negative Prompt sections
- **Visual Feedback**: Smooth animations and visual indicators during dragging
- **Separate Areas**: Categories cannot be moved between Prompt and Negative Prompt sections

## Usage Guide

### Getting Started
1. **Load Keywords**: Click "Load Keywords" to import your keyword data
2. **Description Display Setting**: Use "Show desc" checkbox to toggle keyword description visibility
3. **Select Keywords**: Check the desired keywords from the categorized lists
4. **Adjust Emphasis**: Use `+` and `-` buttons to modify keyword strength
5. **Generate Output**: View the formatted prompt in the output area

### Adding New Keywords
1. Click the "Add" button next to "Prompt Keywords"
2. Fill in the form:
   - **Type**: Choose "prompt" or "negative prompt"
   - **Category**: Enter or select an existing category
   - **Description**: Add a category description
   - **Key**: Enter the keyword text
   - **Desc**: Add a description for the keyword
   - **Count**: Select how many variations to create (1-20)
3. Click "Add" to create the keywords

### Deleting Keywords
1. Click the "Del" button next to "Prompt Keywords"
2. Select the type (Prompt/Negative Prompt)
3. Choose the category
4. Check the keywords you want to delete
5. Click "Del" and confirm the deletion

### Managing Presets
1. **Save Presets**: After selecting and adjusting keywords, click "Save Presets"
2. **Load Presets**: Click "Load Presets" and select a preset file
3. **Auto-completion**: Missing keywords are automatically added to the data

### Organizing Categories
- Drag category titles to reorder them within their respective sections
- Categories in Prompt Keywords can only be reordered within that section
- Categories in Negative Prompt Keywords can only be reordered within that section

## File Formats

### Keywords JSON Structure
```json
{
  "prompt": [
    {
      "category": "Category Name",
      "description": "Category Description",
      "keywords": [
        {
          "key": "keyword_text",
          "desc": "keyword_description"
        }
      ]
    }
  ],
  "negative_prompt": [
    // Same structure as prompt
  ],
  "settings": {
    "showDesc": true,
    "checkedKeywords": {
      "prompt": [
        {"category": "Category Name", "key": "keyword_text"}
      ],
      "negative_prompt": [
        {"category": "Category Name", "key": "keyword_text"}
      ]
    }
  }
}
```

### Presets JSON Structure
```json
{
  "prompt": [
    {
      "key": "keyword_text",
      "category": "Category Name",
      "description": "Category Description",
      "desc": "keyword_description",
      "emphasisType": "normal|strong|weak",
      "emphasisValue": 1.0
    }
  ],
  "negative": [
    // Same structure as prompt
  ]
}
```

## Tips and Best Practices

### Keyword Organization
- Use descriptive category names for better organization
- Group related keywords in the same category
- Use consistent naming conventions for keys and descriptions

### Emphasis Usage
- Use strengthening (1.2-2.0) for important elements you want to emphasize
- Use weakening (1.0) for elements you want to reduce in importance
- Test different emphasis values to find the optimal balance

### Preset Management
- Create presets for different art styles or subjects
- Use descriptive names for preset files
- Regularly backup your keyword data and presets

### Performance
- The tool handles large keyword datasets efficiently
- Drag-and-drop operations are smooth with visual feedback
- All operations are performed client-side for fast response

## Troubleshooting

### Common Issues
1. **Keywords not loading**: Ensure the JSON file has the correct structure
2. **Presets not working**: Check that the preset file contains valid keyword references
3. **Drag-and-drop not working**: Make sure you're dragging the category title, not individual keywords

### Data Recovery
- All keyword data is stored in the browser's memory
- Use "Save Keywords" regularly to backup your data
- Keyword selection state and description display settings are also included when saving
- Preset files serve as additional backups of your configurations

## Technical Notes

### Browser Compatibility
- Modern browsers with ES6+ support
- Requires JavaScript enabled
- Works best with Chrome, Firefox, Safari, and Edge

### File Handling
- All file operations are client-side
- No data is sent to external servers
- Files are processed locally for privacy and security

---

## License

MIT License

Copyright (c) 2025 Michihiro.Takagi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### Contact Information
For questions or support, please contact the author.

**Email:** Michihiro.Takagi@gmail.com

**Feature Requests:** Please use the bulletin board for feature requests.

**Technical Support:** The author created this tool as part of learning Cursor, so technical support may be limited.

---

## Release Notes

### v1.0.0 (2025-01-27)
- **New Features**
  - Keyword description visibility toggle (Show desc checkbox)
  - Save/restore functionality for keyword selection state and description display settings
  - Support message addition (Ko-fi link)
  - Version display addition (v1.0.0)

---

## Support

If you like this tool, please support us at the following URL:
https://ko-fi.com/sia0621 

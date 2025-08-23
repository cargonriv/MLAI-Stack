const fs = require('fs');
const { marked } = require('marked');

const inputFilePath = 'C:\\Users\\cargo\\apps\\MLAI-Stack\\temp_automating_healthcare_diagnostics.txt';
const outputFilePath = 'C:\\Users\\cargo\\apps\\MLAI-Stack\\src\\content\\blog\\automating-healthcare-diagnostics.html';

fs.readFile(inputFilePath, 'utf8', (err, content) => {
  if (err) {
    console.error('Error reading input file:', err);
    return;
  }

  const htmlContent = marked.parse(content);

  fs.writeFile(outputFilePath, htmlContent, 'utf8', err => {
    if (err) {
      console.error('Error writing HTML file:', err);
      return;
    }
    console.log('Successfully converted and wrote HTML content.');
    fs.unlink(inputFilePath, (unlinkErr) => {
      if (unlinkErr) {
        console.error('Error deleting temporary file:', unlinkErr);
      }
    });
  });
});

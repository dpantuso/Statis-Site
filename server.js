const express = require('express');
const { marked } = require('marked');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from the public directory
app.use(express.static('public'));
app.use(express.static('src'));

// Ensure required directories exist
async function ensureDirectories() {
    const dirs = ['src/pages', 'src/blog', 'src/css', 'src/js', 'public'];
    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                console.error(`Error creating directory ${dir}:`, error);
            }
        }
    }
}

// Read and parse template
async function getTemplate() {
    try {
        const template = await fs.readFile(path.join(__dirname, 'src/template.html'), 'utf-8');
        return template;
    } catch (error) {
        console.error('Error reading template:', error);
        throw new Error('Template file not found');
    }
}

// Convert markdown to HTML and inject into template
async function renderPage(markdownPath, title) {
    try {
        const template = await getTemplate();
        const markdown = await fs.readFile(markdownPath, 'utf-8');
        const content = marked(markdown);
        
        return template
            .replace('{{title}}', title)
            .replace('{{content}}', content);
    } catch (error) {
        console.error('Error rendering page:', error);
        if (error.code === 'ENOENT') {
            throw new Error('Page not found');
        }
        throw error;
    }
}

// Routes
app.get('/', async (req, res) => {
    try {
        const html = await renderPage(path.join(__dirname, 'src/pages/index.md'), 'Home');
        res.send(html);
    } catch (error) {
        if (error.message === 'Page not found') {
            res.status(404).send('Page not found');
        } else {
            res.status(500).send('Error loading page');
        }
    }
});

app.get('/blog', async (req, res) => {
    try {
        const html = await renderPage(path.join(__dirname, 'src/pages/blog.md'), 'Blog');
        res.send(html);
    } catch (error) {
        if (error.message === 'Page not found') {
            res.status(404).send('Page not found');
        } else {
            res.status(500).send('Error loading page');
        }
    }
});

app.get('/about', async (req, res) => {
    try {
        const html = await renderPage(path.join(__dirname, 'src/pages/about.md'), 'About');
        res.send(html);
    } catch (error) {
        if (error.message === 'Page not found') {
            res.status(404).send('Page not found');
        } else {
            res.status(500).send('Error loading page');
        }
    }
});

app.get('/faq', async (req, res) => {
    try {
        const html = await renderPage(path.join(__dirname, 'src/pages/faq.md'), 'FAQ');
        res.send(html);
    } catch (error) {
        if (error.message === 'Page not found') {
            res.status(404).send('Page not found');
        } else {
            res.status(500).send('Error loading page');
        }
    }
});

// Blog post route
app.get('/blog/:slug', async (req, res) => {
    try {
        const html = await renderPage(
            path.join(__dirname, `src/blog/${req.params.slug}.md`),
            req.params.slug.replace(/-/g, ' ')
        );
        res.send(html);
    } catch (error) {
        if (error.message === 'Page not found') {
            res.status(404).send('Blog post not found');
        } else {
            res.status(500).send('Error loading blog post');
        }
    }
});

// Initialize and start server
async function startServer() {
    try {
        await ensureDirectories();
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 
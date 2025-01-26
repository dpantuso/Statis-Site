require('dotenv').config();

const express = require('express');
const { marked } = require('marked');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Add body parser for form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
        const template = await fs.readFile(path.join(__dirname, 'src/blog-template.html'), 'utf-8');
        return template;
    } catch (error) {
        console.error('Error reading template:', error);
        throw new Error('Template file not found');
    }
}

// Get recent blog posts
async function getRecentPosts(currentPost = '') {
    try {
        const files = await fs.readdir(path.join(__dirname, 'src/blog'));
        const posts = [];
        
        for (const file of files.slice(0, 5)) {
            if (file.endsWith('.md') && file !== currentPost) {
                const content = await fs.readFile(path.join(__dirname, 'src/blog', file), 'utf-8');
                const title = content.split('\n')[0].replace('# ', '');
                const slug = file.replace('.md', '');
                posts.push(`<li><a href="/blog/${slug}">${title}</a></li>`);
            }
        }
        
        return `<ul>${posts.join('\n')}</ul>`;
    } catch (error) {
        console.error('Error getting recent posts:', error);
        return '<ul><li>No recent posts</li></ul>';
    }
}

// Get blog categories
function getCategories() {
    return `
    <ul>
        <li><a href="/blog/category/strategy">Strategy & Planning</a></li>
        <li><a href="/blog/category/technical">Technical Skills</a></li>
        <li><a href="/blog/category/growth">Growth & Monetization</a></li>
        <li><a href="/blog/category/success">Success Stories</a></li>
    </ul>`;
}

// Convert markdown to HTML and inject into template
async function renderPage(markdownPath, title, isBlogPost = false) {
    try {
        const template = await getTemplate();
        const markdown = await fs.readFile(markdownPath, 'utf-8');
        const content = marked(markdown);
        
        let html = template.replace('{{title}}', title)
                          .replace('{{content}}', content);

        // Add meta, recent posts, and categories for blog posts
        const meta = isBlogPost ? markdown.split('\n')[1] : '';
        const recentPosts = await getRecentPosts(isBlogPost ? path.basename(markdownPath) : '');
        const categories = getCategories();
        
        html = html.replace('{{meta}}', meta)
                   .replace('{{recent_posts}}', recentPosts)
                   .replace('{{categories}}', categories);
        
        return html;
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
        const indexPath = path.join(__dirname, 'src/index.html');
        const content = await fs.readFile(indexPath, 'utf-8');
        res.send(content);
    } catch (error) {
        console.error('Error serving index:', error);
        res.status(500).send('Error loading home page');
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

app.get('/academy', async (req, res) => {
    try {
        const html = await renderPage(path.join(__dirname, 'src/pages/academy.md'), 'Academy');
        res.send(html);
    } catch (error) {
        if (error.message === 'Page not found') {
            res.status(404).send('Page not found');
        } else {
            res.status(500).send('Error loading page');
        }
    }
});

app.get('/contact', async (req, res) => {
    try {
        const html = await renderPage(path.join(__dirname, 'src/pages/contact.md'), 'Contact');
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
            req.params.slug.replace(/-/g, ' '),
            true // This is a blog post
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

// ConvertKit form submission
app.post('/subscribe', async (req, res) => {
    const { email_address, first_name } = req.body;
    const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
    const FORM_ID = process.env.CONVERTKIT_FORM_ID;

    try {
        const response = await axios.post(
            `https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe`,
            {
                api_key: CONVERTKIT_API_KEY,
                email: email_address,
                first_name: first_name
            }
        );

        res.json({ success: true, message: 'Successfully subscribed!' });
    } catch (error) {
        console.error('ConvertKit API Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error subscribing to newsletter' 
        });
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
# Autosana MVP - AI-Powered Test Automation Platform

A modern test automation platform that democratizes QA workflows using AI and Appium. Convert natural language test cases into automated test scripts and execute them on mobile and web applications.

## 🚀 Features

- **Natural Language Test Cases**: Input test scenarios in plain English
- **AI-Powered Conversion**: LLM converts natural language to Appium scripts
- **Multi-Platform Support**: Android, iOS, and Web applications
- **Automated Execution**: Run tests via Appium MCP server
- **Comprehensive Reporting**: Detailed reports with screenshots and logs
- **Email Notifications**: Automatic report delivery to stakeholders

## 🛠 Tech Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express
- **AI/LLM**: OpenAI API
- **Automation**: Appium MCP Server
- **Email**: SendGrid
- **File Upload**: Multer

## 📦 Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd autosana-mvp
   npm run install-all
   ```

2. **Environment Setup**
   ```bash
   # Copy environment files
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

3. **Configure Environment Variables**
   
   **Server (.env)**
   ```
   PORT=5000
   OPENAI_API_KEY=your_openai_api_key
   SENDGRID_API_KEY=your_sendgrid_api_key
   FROM_EMAIL=your_verified_sender@domain.com
   TO_EMAIL=amahangade24@gmail.com
   APPIUM_MCP_URL=http://localhost:4723
   ```

   **Client (.env)**
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

4. **Start Development Servers**
   ```bash
   npm run dev
   ```

## 🎯 Usage

1. **Access the Web Interface**: Open `http://localhost:3000`
2. **Upload App Binary**: Upload APK/IPA file or provide web app URL
3. **Enter Test Case**: Describe your test scenario in natural language
4. **Run Automation**: Click "Run Test" to execute the automation
5. **Review Report**: Check email for detailed test results

## 📁 Project Structure

```
autosana-mvp/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
├── server/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── services/           # Business logic
│   ├── middleware/         # Express middleware
│   └── utils/              # Helper functions
├── uploads/                # App binary storage
└── reports/                # Test reports and screenshots
```

## 🔧 Configuration

### Appium MCP Server
Ensure your Appium MCP server is running and accessible at the configured URL. The platform will connect to this server to execute test scripts.

### OpenAI API
Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys) and add it to the server environment variables.

### SendGrid
Set up SendGrid for email notifications:
1. Create a SendGrid account
2. Generate an API key
3. Verify your sender email address
4. Add credentials to environment variables

## 🧪 Example Test Cases

- "Login with valid credentials and verify dashboard loads"
- "Navigate to settings page and change theme to dark mode"
- "Add item to cart and proceed to checkout"
- "Search for products and filter by price range"

## 📊 Test Reports

Reports include:
- Test execution status (Pass/Fail)
- Screenshots at key steps
- Error logs and stack traces
- Performance metrics
- Test duration and timestamp

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Contact: amahangade24@gmail.com

---

**Built with ❤️ for modern QA teams**

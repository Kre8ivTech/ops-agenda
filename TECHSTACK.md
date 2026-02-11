#Kre8ivHosting Wordpress Tech Stack Documentation

Rule: This will be used for all wordpress plugin development. If Divi or Elementor requirements are identified utilize knowledgebases below.

## 1. AWS EC2 (Virtual Machine Hosting)
- **Description**: EC2 is used to host the WordPress site on AWS infrastructure.
- **Documentation**: [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/index.html)

## 2. AlmaLinux v8.10.0 (Operating System)
- **Description**: AlmaLinux provides the stable operating system for the hosting server.
- **Documentation**: [AlmaLinux Documentation](https://wiki.almalinux.org/)

## 3. WHM / cPanel (Web Hosting Control Panel)
- **Description**: WHM is used to manage the server, and cPanel is for managing hosted websites.
- **Documentation**:
  - [WHM Installation and Configuration](https://docs.cpanel.net/installation-guide/)
  - [cPanel/WHM Guide](https://docs.cpanel.net/knowledge-base/web-services/launch-an-aws-ami-instance/)

## 4. PHP (Scripting Language for WordPress)
- **Description**: PHP is the backend scripting language that powers WordPress.
- **Documentation**: [PHP Documentation](https://www.php.net/docs.php)

## 5. MySQL (Database for WordPress)
- **Description**: MySQL is the relational database management system (RDBMS) used by WordPress to store content and settings.
- **Documentation**: [MySQL Documentation](https://dev.mysql.com/doc/)

## 6. WordPress (Content Management System)
- **Description**: WordPress is the CMS used to build and manage the website.
- **Documentation**:
  - [WordPress Installation Guide](https://developer.wordpress.org/advanced-administration/before-install/howto-install/)
  - [WordPress General Documentation](https://wordpress.org/documentation/)

## 7. Divi Theme (WordPress Theme)
- **Description**: Divi is a premium WordPress theme that offers drag-and-drop page building.
- **Documentation**: [Divi Documentation](https://www.elegantthemes.com/documentation/divi/)

## 8. Elementor (WordPress Page Builder)
- **Description**: Elementor is a popular drag-and-drop page builder for WordPress that enables advanced design and customization.
- **Documentation**: [Elementor Documentation](https://elementor.com/help/)

# Next App Tech Stack

Rule: This will be used for all next app development.

## 1. **Frontend Framework: Next.js**
   - **Description**: Next.js is a powerful React-based framework used for building the frontend of the CMS. It supports **Server-Side Rendering (SSR)** and **Static Site Generation (SSG)** for fast page loads and SEO optimization.
   - **Key Features**:
     - Server-side rendering (SSR) for SEO and performance.
     - Static site generation (SSG) for fast, pre-rendered content.
     - API routes for backend logic and content fetching.
     - Real-time data fetching using **Supabase** and **Payload CMS** APIs.
   - **Documentation**: [Next.js Documentation](https://nextjs.org/docs)

---

## 2. **Backend: Supabase**
   - **Description**: Supabase is an open-source backend-as-a-service that provides a PostgreSQL database, authentication, and real-time functionality. It will handle user authentication, data storage, and real-time updates in the CMS.
   - **Key Features**:
     - **Database**: Managed **PostgreSQL** database for content storage.
     - **Authentication**: Provides easy-to-integrate **OAuth** and **email/password** authentication.
     - **Real-Time**: Real-time data synchronization for content updates.
     - **File Storage**: Integration with **AWS S3** for file storage.
     - **RESTful API**: Provides a powerful API to interact with the backend.
   - **Documentation**: [Supabase Documentation](https://supabase.io/docs)

---

## 3. **Headless CMS: Payload CMS (Open Source)**
   - **Description**: Payload CMS is a headless CMS that provides a flexible and extensible framework for managing content. It integrates easily with **Next.js** for seamless content delivery via its REST or GraphQL APIs.
   - **Key Features**:
     - **Content Types**: Easily define and manage custom content models like posts, pages, and categories.
     - **Admin Panel**: Customizable admin interface for content creators.
     - **Media Management**: Integration with **AWS S3** for media file management (e.g., images, videos).
     - **APIs**: Payload offers both **REST** and **GraphQL** APIs for content manipulation and querying.
     - **Role-Based Access Control (RBAC)**: Configure user roles and permissions (e.g., admin, editor, author).
   - **Documentation**: [Payload CMS Documentation](https://payloadcms.com/docs)

---

## 4. **Visual Page Builder: GrapesJS**
   - **Description**: GrapesJS is a visual page builder used for designing pages and content in the CMS. It allows users to drag and drop components to create rich layouts without coding.
   - **Key Features**:
     - **Drag-and-Drop Interface**: A visual editor for creating responsive pages.
     - **Custom Components**: Users can create custom components or use pre-built ones.
     - **HTML/CSS Editor**: Advanced users can modify the underlying code directly for precise control.
     - **Integration with AWS S3**: Store media assets such as images and videos directly in **AWS S3** and link them in page designs.
     - **Extensibility**: Easily extendable with plugins for adding more features or integrations.
   - **Documentation**: [GrapesJS Documentation](https://grapesjs.com/docs/)

---

## 5. **File Storage: AWS S3**
   - **Description**: **AWS S3** will be used to store all media files (images, videos, PDFs, etc.) uploaded by users or content creators within the CMS.
   - **Key Features**:
     - **Scalable Object Storage**: Store an unlimited amount of data.
     - **Easy File Uploads**: Use the **AWS SDK** to handle file uploads from **GrapesJS** or **Payload CMS**.
     - **Access Control**: Manage access and permissions for files using **AWS IAM** roles.
     - **CDN Integration**: Use **Amazon CloudFront** for fast and secure global content delivery.
   - **Documentation**: [AWS S3 Documentation](https://docs.aws.amazon.com/s3/index.html)

---

## 6. **Deployment: Vercel**
   - **Description**: **Vercel** will host the frontend Next.js app with serverless architecture, providing fast deployment and scaling capabilities.
   - **Key Features**:
     - **Serverless Functions**: Handle backend operations such as content fetching, authentication, or file uploads.
     - **Automatic Deployment**: Integrate with GitHub to auto-deploy changes to the frontend app.
     - **Global Edge Network**: Automatically serve the content closest to the user for fast loading times.
   - **Documentation**: [Vercel Documentation](https://vercel.com/docs)

---

## 7. **Search Functionality**
   - **Description**: Implement search features to allow users to quickly find content within the CMS. You can leverage **Algolia** or **PostgreSQL Full-Text Search** to implement this.
   - **Key Features**:
     - **Algolia**: A powerful search engine for real-time and fast content searches.
     - **PostgreSQL Full-Text Search**: Use PostgreSQL's built-in full-text search to enable efficient search capabilities within the CMS.
   - **Documentation**: [Algolia Documentation](https://www.algolia.com/doc/)

---

## 8. **SEO and Meta Data**
   - **Description**: Implement SEO tools to allow content creators to optimize their content for search engines.
   - **Key Features**:
     - **Meta Tags**: Add custom **title**, **description**, and **keywords** for SEO optimization.
     - **Open Graph**: Support for Open Graph and Twitter Card metadata for rich social media previews.
     - **Canonical URLs**: Enable users to define canonical URLs to avoid duplicate content issues.
   - **Documentation**: [Open Graph Protocol](https://ogp.me/)

---

### **Summary Tech Stack for Full CMS**

- **Frontend**: **Next.js** (React framework for SSR/SSG)
- **Backend**: **Supabase** (PostgreSQL, Authentication, Real-Time, File Storage)
- **CMS**: **Payload CMS** (Headless CMS with flexible API, media management, and role-based access)
- **Visual Page Builder**: **GrapesJS** (Drag-and-drop page editor)
- **File Storage**: **AWS S3** (Media storage and CDN integration)
- **Deployment**: **Vercel** (Serverless deployment and hosting)
- **Authentication**: **Supabase Auth** (OAuth, email/password authentication)
- **Search**: **Algolia** or **PostgreSQL Full-Text Search**
- **SEO**: Meta tags, Open Graph, and canonical URL handling

---

This **tech stack** is designed for building a **complete CMS** with modern features like visual content creation, flexible data management, and scalable cloud infrastructure. By combining **Next.js**, **Payload CMS**, **Supabase**, **GrapesJS**, and **AWS S3**, you can create a full-featured CMS with robust content management, real-time updates, visual page building, and efficient media storage.

--- 

This **markdown (.md)** document captures the **full tech stack** and links to each technology's documentation, providing clarity on how the different components integrate together.


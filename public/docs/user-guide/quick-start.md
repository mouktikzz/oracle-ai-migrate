# Quick Start Tutorial

Get up and running with the Sybase to Oracle Migration Tool in just a few minutes!

## 🎯 Overview

This tutorial will walk you through your first migration in 5 simple steps:
1. Account setup and login
2. Upload a sample file
3. Review the conversion
4. Generate a report
5. Download your results

**⏱️ Estimated time: 10-15 minutes**

## 📋 Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Sample Sybase SQL files to convert
- Internet connection
- Email address for account creation

## 🚀 Step 1: Account Setup

### Creating Your Account

1. **Navigate** to the application URL
2. **Click** "Sign Up" on the landing page
3. **Choose** your registration method:
   - Email and password
   - Google account
   - GitHub account (if available)
4. **Fill out** the registration form:
   ```
   Email: your.email@company.com
   Password: [secure password]
   Organization: [your company name]
   Role: [your role/title]
   ```
5. **Check your email** for verification link
6. **Click** the verification link to activate your account

### First Login

1. **Return** to the application
2. **Click** "Sign In"
3. **Enter** your credentials
4. **Accept** terms of service (if prompted)

## 📁 Step 2: Upload Your First File

### Using the Sample File

If you don't have a Sybase file ready, you can use this sample stored procedure:

```sql
-- Sample Sybase Stored Procedure
CREATE PROCEDURE GetCustomerOrders
    @CustomerID INT,
    @StartDate DATETIME,
    @EndDate DATETIME
AS
BEGIN
    SELECT 
        o.OrderID,
        o.OrderDate,
        o.TotalAmount,
        od.ProductID,
        od.Quantity,
        od.UnitPrice
    FROM Orders o
    INNER JOIN OrderDetails od ON o.OrderID = od.OrderID
    WHERE o.CustomerID = @CustomerID
      AND o.OrderDate BETWEEN @StartDate AND @EndDate
    ORDER BY o.OrderDate DESC
END
```

Save this as `sample_procedure.sql` on your computer.

### Upload Process

1. **Click** the "Upload Files" button on the dashboard
2. **Select** your sample file or drag it into the upload area
3. **Choose** AI model:
   - **Default Model**: For quick testing
   - **Gemini AI**: For best quality (recommended)
4. **Click** "Start Conversion"
5. **Wait** for the processing indicator to complete

## 🔍 Step 3: Review the Conversion

### Understanding the Results

After conversion, you'll see three panels:

#### 1. File Status Panel
- **✅ Success**: Your file converted successfully
- **File size**: Original vs converted file size
- **Conversion time**: How long the process took

#### 2. Code Comparison Panel
- **Left side**: Original Sybase code
- **Right side**: Converted Oracle code
- **Highlighted differences**: Changes are color-coded

#### 3. Issues Panel
- **Warnings**: Items that need attention
- **Suggestions**: Optimization recommendations
- **Notes**: Explanation of changes made

### Sample Conversion Result

Your Sybase procedure will be converted to something like this:

```sql
-- Converted Oracle Stored Procedure
CREATE OR REPLACE PROCEDURE GetCustomerOrders(
    p_CustomerID IN NUMBER,
    p_StartDate IN DATE,
    p_EndDate IN DATE,
    p_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_cursor FOR
    SELECT 
        o.OrderID,
        o.OrderDate,
        o.TotalAmount,
        od.ProductID,
        od.Quantity,
        od.UnitPrice
    FROM Orders o
    INNER JOIN OrderDetails od ON o.OrderID = od.OrderID
    WHERE o.CustomerID = p_CustomerID
      AND o.OrderDate BETWEEN p_StartDate AND p_EndDate
    ORDER BY o.OrderDate DESC;
END GetCustomerOrders;
/
```

### Key Changes to Notice

1. **Parameter syntax**: `@CustomerID` → `p_CustomerID IN NUMBER`
2. **Return method**: Added `SYS_REFCURSOR` for result set
3. **Procedure termination**: Added `/` at the end
4. **Variable naming**: Oracle conventions applied

## 📊 Step 4: Generate Your First Report

### Creating a Migration Report

1. **Click** "Generate Report" button
2. **Select** report type:
   - **Quick Summary**: Basic conversion statistics
   - **Detailed Analysis**: In-depth breakdown
   - **Technical Report**: Full technical documentation
3. **Add custom notes** (optional):
   ```
   First test conversion of sample stored procedure.
   Testing the migration tool capabilities.
   ```
4. **Click** "Generate Report"

### Report Contents

Your report will include:
- **Executive Summary**: High-level results
- **Conversion Statistics**: Success rates, issues found
- **File Analysis**: Detailed breakdown per file
- **Recommendations**: Next steps and best practices
- **Technical Notes**: Implementation details

## 💾 Step 5: Download Results

### Download Options

1. **Individual File**: Click "Download" next to the converted file
2. **Complete Package**: Click "Download All" for:
   - Converted Oracle file(s)
   - Migration report (PDF)
   - Conversion log
   - Original files (for reference)

### File Organization

Downloaded files will be organized as:
```
migration_results_[timestamp]/
├── converted/
│   └── sample_procedure_oracle.sql
├── original/
│   └── sample_procedure.sql
├── reports/
│   └── migration_report.pdf
└── logs/
    └── conversion_log.txt
```

## 🎉 Congratulations!

You've successfully completed your first Sybase to Oracle migration! 

## 🔄 Next Steps

### Immediate Actions
1. **Review** the converted code in your Oracle environment
2. **Test** the procedure with sample data
3. **Compare** performance with original Sybase version

### Expanding Your Migration
1. **Upload multiple files** to test batch processing
2. **Try different AI models** to compare results
3. **Create custom conversion rules** for your specific needs
4. **Invite team members** to collaborate on larger migrations

### Learning More
1. **Read** the complete [User Guide](./README.md)
2. **Explore** [Advanced Features](./advanced-features.md)
3. **Review** [Best Practices](./best-practices.md)
4. **Join** the community forum for tips and tricks

## 🆘 Need Help?

### Common First-Time Issues

**Q: The conversion is taking too long**
- A: Large files or complex code may take 2-3 minutes. Wait for completion.

**Q: I see warnings in my conversion**
- A: Warnings are normal. Review each one and determine if manual adjustment is needed.

**Q: The Oracle code doesn't work in my database**
- A: Check Oracle version compatibility and required privileges.

### Getting Support

- **In-app Help**: Click the "?" icon in any section
- **Documentation**: Browse the complete documentation
- **Support Chat**: Use the chat widget for immediate assistance
- **Email Support**: contact support team for complex issues

### Community Resources

- **Forum Discussions**: Share experiences with other users
- **Best Practices**: Learn from successful migrations
- **Templates**: Download common conversion patterns
- **Webinars**: Join live training sessions

## 🏆 Success Tips

1. **Start Simple**: Begin with basic stored procedures before complex packages
2. **Test Thoroughly**: Always test converted code in a development environment
3. **Document Changes**: Keep notes on manual adjustments made
4. **Iterate**: Use lessons learned to improve subsequent migrations
5. **Collaborate**: Share knowledge with your team throughout the process

Welcome to efficient database migration! The tool is designed to make your Sybase to Oracle transition as smooth as possible.
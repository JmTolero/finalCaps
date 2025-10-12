# Feedback System Documentation

## Overview
The ChillNet feedback system provides a comprehensive platform for customers and vendors to submit feedback, questions, bug reports, and support requests. Administrators can manage, respond to, and track all feedback through a dedicated management interface.

## System Architecture

### User Roles & Access Points

#### 1. **Customer Feedback** 
- **Access Point**: 5th header icon button (feedback icon) on customer dashboard
- **Purpose**: Submit general feedback, bug reports, feature requests, questions, or complaints
- **Features**:
  - Category selection with icons (Bug, Feature Request, Question, Complaint, Other)
  - Subject line (max 255 characters)
  - Detailed description (10-2000 characters)
  - Visual feedback on submission
  - Auto-close after successful submission

#### 2. **Vendor Support**
- **Access Point**: "Customer Support" option in profile dropdown menu
- **Purpose**: Contact platform support for help with vendor operations
- **Features**:
  - Same feedback modal as customers but branded as "Contact Support"
  - Categorized support requests
  - Track support ticket status
  - Receive admin responses

#### 3. **Admin Management**
- **Access Point**: Sidebar menu → "Feedback"
- **Route**: `/admin/feedback`
- **Features**:
  - View all feedback from customers and vendors
  - Filter by status, category, user role, and priority
  - Real-time statistics dashboard
  - Respond to feedback
  - Update status and priority
  - Track response history

---

## Database Schema

### Feedback Table
```sql
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_role VARCHAR(20) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    admin_response TEXT,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
- `idx_feedback_user_id` - For user-specific queries
- `idx_feedback_status` - For filtering by status
- `idx_feedback_created_at` - For sorting by date
- `idx_feedback_user_role` - For filtering by user role

---

## API Endpoints

### 1. Submit Feedback
**POST** `/api/feedback`
- **Auth**: Required (customer or vendor)
- **Body**:
  ```json
  {
    "subject": "string (required, max 255)",
    "category": "bug|feature_request|question|complaint|other",
    "description": "string (required, 10-2000 chars)"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Feedback submitted successfully",
    "data": {
      "id": 1,
      "created_at": "2025-10-12T..."
    }
  }
  ```

### 2. Get My Feedback
**GET** `/api/feedback/my-feedback`
- **Auth**: Required
- **Returns**: Array of user's feedback submissions

### 3. Get All Feedback (Admin Only)
**GET** `/api/feedback/all?status=&category=&role=&priority=`
- **Auth**: Required (admin only)
- **Query Params**:
  - `status`: pending|in_progress|resolved|closed
  - `category`: bug|feature_request|question|complaint|other
  - `role`: customer|vendor
  - `priority`: low|medium|high|urgent
- **Returns**: Array of feedback with statistics

### 4. Update Feedback Status (Admin Only)
**PUT** `/api/feedback/:id/status`
- **Auth**: Required (admin only)
- **Body**:
  ```json
  {
    "status": "pending|in_progress|resolved|closed",
    "priority": "low|medium|high|urgent"
  }
  ```

### 5. Respond to Feedback (Admin Only)
**POST** `/api/feedback/:id/respond`
- **Auth**: Required (admin only)
- **Body**:
  ```json
  {
    "response": "string (required)"
  }
  ```
- **Effect**: Auto-updates status to 'in_progress' if pending

### 6. Delete Feedback (Admin Only)
**DELETE** `/api/feedback/:id`
- **Auth**: Required (admin only)
- **Returns**: Success confirmation

---

## Frontend Components

### 1. FeedbackModal Component
**Location**: `frontend/src/components/shared/FeedbackModal.jsx`

**Props**:
- `isOpen` (boolean) - Controls modal visibility
- `onClose` (function) - Callback when modal closes
- `userRole` (string) - 'customer' or 'vendor' for UI customization

**Features**:
- Responsive design
- Real-time validation
- Character counters
- Success/error feedback
- Auto-close on success
- Disabled during submission

**Usage**:
```jsx
import FeedbackModal from '../../components/shared/FeedbackModal';

const [showFeedbackModal, setShowFeedbackModal] = useState(false);

<FeedbackModal 
  isOpen={showFeedbackModal}
  onClose={() => setShowFeedbackModal(false)}
  userRole="customer"
/>
```

### 2. Customer Integration
**Location**: `frontend/src/pages/customer/customer.jsx`

**Integration Points**:
- Import FeedbackModal component
- Add `showFeedbackModal` state
- Feedback button in header navigation (5th button)
- Modal render at component bottom

### 3. Vendor Integration
**Location**: `frontend/src/components/shared/ProfileDropdown.jsx`

**Integration Points**:
- Import FeedbackModal component
- Add "Customer Support" menu item
- Modal trigger on menu item click
- Automatic role detection

### 4. Admin Management Page
**Location**: `frontend/src/pages/admin/feedback.jsx`

**Features**:
- Statistics cards (Total, Pending, Urgent, Resolved)
- Multi-filter system
- Expandable feedback items
- Inline status/priority editing
- Response modal
- Real-time updates
- Empty states

**Statistics Tracked**:
- Total feedback count
- Status breakdown (pending, in_progress, resolved, closed)
- User role breakdown (customer vs vendor)
- Priority breakdown (urgent, high, medium, low)

---

## Feedback Categories

| Category | Icon | Description | Typical Use |
|----------|------|-------------|-------------|
| **Bug Report** | 🐛 | Technical issues or errors | App crashes, broken features, display issues |
| **Feature Request** | 💡 | Suggestions for new features | New functionality, improvements |
| **Question** | ❓ | General inquiries | How-to questions, clarifications |
| **Complaint** | 😞 | Dissatisfaction or concerns | Service issues, policy concerns |
| **Other** | 📝 | Miscellaneous feedback | Anything not fitting above categories |

---

## Status Workflow

```
┌─────────┐
│ Pending │ ─┐
└─────────┘  │
             ↓
        ┌────────────┐
        │ In Progress│ ← Admin responds
        └────────────┘
             ↓
        ┌──────────┐
        │ Resolved │
        └──────────┘
             ↓
        ┌────────┐
        │ Closed │
        └────────┘
```

**Status Definitions**:
- **Pending**: Newly submitted, awaiting admin review
- **In Progress**: Admin has acknowledged and is working on it
- **Resolved**: Issue fixed or question answered
- **Closed**: Feedback archived, no further action needed

---

## Priority Levels

| Priority | Badge Color | Use Case | Response Time |
|----------|-------------|----------|---------------|
| **Urgent** | Red | Critical bugs, system down | Within 1 hour |
| **High** | Orange | Major issues, broken features | Within 4 hours |
| **Medium** | Yellow | Standard requests, minor issues | Within 24 hours |
| **Low** | Gray | Suggestions, non-urgent questions | Within 48 hours |

---

## Installation & Setup

### 1. Database Migration
Run the feedback table migration:
```bash
cd backend
node run_feedback_migration.js
```

### 2. Verify API Routes
The feedback routes should already be registered in `backend/src/app.js`:
```javascript
const feedbackRoutes = require('./routes/feedback');
app.use('/api/feedback', feedbackRoutes);
```

### 3. Frontend Dependencies
No additional dependencies required. Uses existing:
- React
- Axios
- Tailwind CSS

### 4. Environment Variables
No new environment variables needed. Uses existing:
- `REACT_APP_API_URL` - Backend API base URL
- Session storage for authentication tokens

---

## Testing Instructions

### Customer Feedback Testing
1. Log in as a customer
2. Click the feedback icon (5th button in header)
3. Fill out the form:
   - Select a category
   - Enter a subject
   - Write a description (min 10 chars)
4. Submit and verify success message
5. Check admin panel to see the feedback

### Vendor Support Testing
1. Log in as a vendor
2. Click profile dropdown in top-right
3. Select "Customer Support"
4. Submit a support request
5. Verify it appears in admin panel with 'vendor' role

### Admin Management Testing
1. Log in as admin
2. Navigate to Feedback in sidebar
3. Verify statistics are displayed
4. Test filters (status, category, role, priority)
5. Expand a feedback item
6. Change status/priority
7. Submit a response
8. Verify response appears in feedback

### API Testing with Postman/cURL
```bash
# Submit feedback
curl -X POST http://localhost:3001/api/feedback \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test feedback",
    "category": "question",
    "description": "This is a test feedback submission"
  }'

# Get all feedback (admin)
curl http://localhost:3001/api/feedback/all?status=pending \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Respond to feedback
curl -X POST http://localhost:3001/api/feedback/1/respond \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"response": "Thank you for your feedback!"}'
```

---

## Security Features

### Authentication & Authorization
- All endpoints require valid JWT token
- Admin-only endpoints verified via middleware
- User ID extracted from token (no client-side manipulation)
- Feedback tied to authenticated user

### Input Validation
- Subject: Required, max 255 characters
- Category: Enum validation (5 valid options)
- Description: Required, 10-2000 characters
- Server-side validation for all inputs
- SQL injection protection via parameterized queries

### Data Privacy
- Users can only see their own feedback (via my-feedback endpoint)
- Admin can see all feedback
- User information protected in responses
- Cascade delete on user removal

---

## Performance Considerations

### Database Optimization
- Indexed columns for common queries
- Efficient filtering with parameterized queries
- Proper JOIN usage for related data
- Status counts calculated in single query

### Frontend Optimization
- Lazy loading for admin feedback list
- Debounced filter changes
- Optimistic UI updates
- Modal lazy rendering
- Component memoization opportunities

---

## Future Enhancements

### Potential Features
1. **Email Notifications**
   - Notify users when admin responds
   - Daily digest for admins with pending feedback

2. **Attachments**
   - Allow users to upload screenshots
   - Support for PDFs and documents

3. **Feedback Ratings**
   - Users rate admin responses
   - Track response quality

4. **Auto-tagging**
   - AI-powered category suggestions
   - Keyword extraction

5. **Search Functionality**
   - Full-text search across feedback
   - Advanced search filters

6. **Feedback Analytics**
   - Trend analysis
   - Common issue identification
   - Response time metrics

7. **User Feedback History**
   - Dedicated page for users to view their submissions
   - Track status changes
   - See admin responses

8. **Canned Responses**
   - Template responses for common questions
   - Quick response buttons

---

## Troubleshooting

### Common Issues

**Issue**: Feedback button not appearing
- **Solution**: Verify feedback icon is imported in customer.jsx
- Check feedbackIcon path in imports

**Issue**: 403 Forbidden on admin endpoints
- **Solution**: Verify user has admin role
- Check JWT token is valid
- Ensure middleware is properly configured

**Issue**: Feedback not saving
- **Solution**: Check database migration ran successfully
- Verify feedback table exists
- Check backend console for errors

**Issue**: Modal not closing
- **Solution**: Verify onClose callback is provided
- Check for JavaScript errors
- Ensure state is properly updated

---

## Support & Maintenance

### Monitoring
- Track feedback submission rates
- Monitor response times
- Check for unhandled errors
- Review user satisfaction

### Regular Tasks
- Weekly review of pending feedback
- Monthly analytics review
- Quarterly feature prioritization from requests
- Database cleanup of old closed feedback

---

## Contact
For questions about the feedback system implementation, refer to:
- Backend API: `backend/src/controller/feedbackController.js`
- Frontend Components: `frontend/src/components/shared/FeedbackModal.jsx`
- Admin Interface: `frontend/src/pages/admin/feedback.jsx`

---

## Changelog

### Version 1.0.0 (2025-10-12)
- ✅ Initial feedback system implementation
- ✅ Customer feedback modal (5th header button)
- ✅ Vendor support (profile dropdown)
- ✅ Admin management page (sidebar)
- ✅ Complete CRUD API endpoints
- ✅ Database schema and migrations
- ✅ Response system
- ✅ Status and priority management
- ✅ Filtering and statistics
- ✅ Role-based access control


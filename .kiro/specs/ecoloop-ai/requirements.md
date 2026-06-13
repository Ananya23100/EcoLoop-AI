# Requirements Document

## Introduction

EcoLoop AI is an AI-powered platform designed for Amazon HackOn 2026 that addresses the environmental and financial waste caused by discarded returned and underutilized products. The platform analyzes product images and metadata to determine product condition, recommends optimal next actions (resell, refurbish, donate, recycle), estimates resale value, and generates sustainability impact metrics. By leveraging Amazon Bedrock for AI inference, Amazon S3 for storage, and DynamoDB for data persistence, EcoLoop AI transforms product waste into measurable environmental impact.

## Glossary

- **Platform**: The EcoLoop AI web application comprising a React frontend and FastAPI backend
- **User**: A person interacting with the Platform to assess product condition and receive recommendations
- **Product_Image**: A photograph of a product uploaded by the User for AI analysis
- **Product_Metadata**: Structured information about a product including category, age, and original price
- **Condition_Grade**: A classification assigned to a product indicating its physical state, using grades A (Like New), B (Good), C (Fair), or D (Poor)
- **Action_Recommendation**: The suggested next step for a product based on its Condition_Grade and Product_Metadata, one of: resell, refurbish, donate, or recycle
- **Resale_Value**: The estimated monetary value of a product if sold in its current condition
- **Green_Credits**: A numerical sustainability score awarded to the User based on the environmental benefit of following the Action_Recommendation
- **Sustainability_Dashboard**: A visual interface displaying aggregated environmental impact metrics for a User
- **AI_Engine**: The Amazon Bedrock-powered component that performs image analysis, condition grading, and value estimation
- **Image_Store**: Amazon S3 bucket used to store uploaded Product_Images
- **Data_Store**: Amazon DynamoDB tables used to persist product assessments, User data, and sustainability metrics
- **Assessment**: A complete evaluation record containing the Condition_Grade, Action_Recommendation, Resale_Value, and Green_Credits for a single product
- **Buyer_Persona**: A profile representing a likely buyer type for a product, generated based on product category, condition, and estimated value

## Requirements

### Requirement 1: Product Image Upload

**User Story:** As a User, I want to upload a product image, so that the AI can visually assess the product condition.

#### Acceptance Criteria

1. WHEN a User selects an image file, THE Platform SHALL accept image files in JPEG, PNG, or WebP format
2. WHEN a User uploads a Product_Image, THE Platform SHALL store the image in the Image_Store with a unique identifier
3. WHEN a User uploads an image file exceeding 10 MB, THE Platform SHALL reject the upload and display a file size error message
4. WHEN a User uploads a file that is not a valid image format, THE Platform SHALL reject the upload and display a format error message
5. WHEN a Product_Image upload completes successfully, THE Platform SHALL display a preview of the uploaded image to the User
6. WHILE a Product_Image is uploading, THE Platform SHALL display a progress indicator to the User

### Requirement 2: Product Metadata Entry

**User Story:** As a User, I want to enter product details such as category, age, and original price, so that the AI has contextual information to make accurate assessments.

#### Acceptance Criteria

1. THE Platform SHALL provide a form with fields for product category, product age in months, and original price in USD
2. WHEN a User submits the product metadata form, THE Platform SHALL validate that all required fields contain values
3. WHEN a User enters a product age less than 0 or greater than 240 months, THE Platform SHALL display a validation error for the age field
4. WHEN a User enters an original price less than or equal to 0, THE Platform SHALL display a validation error for the price field
5. THE Platform SHALL provide a predefined list of product categories including Electronics, Clothing, Furniture, Books, Toys, Appliances, and Sports Equipment
6. IF a required field is empty upon form submission, THEN THE Platform SHALL highlight the field and display a descriptive error message

### Requirement 3: AI Condition Grading

**User Story:** As a User, I want the AI to analyze my product and assign a condition grade, so that I understand the current state of the product.

#### Acceptance Criteria

1. WHEN a User submits a Product_Image and Product_Metadata, THE AI_Engine SHALL analyze the image and assign a Condition_Grade of A, B, C, or D
2. THE AI_Engine SHALL assign grade A (Like New) to products with no visible wear, grade B (Good) to products with minor cosmetic wear, grade C (Fair) to products with moderate wear or minor functional issues, and grade D (Poor) to products with significant damage or major functional issues
3. WHEN the AI_Engine completes condition analysis, THE Platform SHALL display the Condition_Grade with a textual description of the grade meaning
4. WHILE the AI_Engine is processing the product analysis, THE Platform SHALL display a loading state indicating analysis is in progress
5. IF the AI_Engine fails to process the image, THEN THE Platform SHALL display an error message and allow the User to retry the analysis
6. WHEN the AI_Engine assigns a Condition_Grade, THE AI_Engine SHALL provide a confidence score between 0 and 100 for the assigned grade

### Requirement 4: Action Recommendation

**User Story:** As a User, I want to receive a recommended action for my product, so that I know the most sustainable and valuable next step.

#### Acceptance Criteria

1. WHEN the AI_Engine assigns a Condition_Grade to a product, THE AI_Engine SHALL generate an Action_Recommendation of resell, refurbish, donate, or recycle
2. THE AI_Engine SHALL recommend "resell" for products with Condition_Grade A or B and Resale_Value above 20 percent of original price
3. THE AI_Engine SHALL recommend "refurbish" for products with Condition_Grade B or C where refurbishment cost is estimated below 40 percent of Resale_Value after refurbishment
4. THE AI_Engine SHALL recommend "donate" for products with Condition_Grade C or D that remain functional but have low Resale_Value
5. THE AI_Engine SHALL recommend "recycle" for products with Condition_Grade D that are non-functional or where Resale_Value is below 5 percent of original price
6. WHEN an Action_Recommendation is generated, THE Platform SHALL display the recommendation with a brief explanation of the reasoning

### Requirement 5: Resale Value Estimation

**User Story:** As a User, I want to see an estimated resale value for my product, so that I can make informed decisions about selling the product.

#### Acceptance Criteria

1. WHEN the AI_Engine assigns a Condition_Grade, THE AI_Engine SHALL estimate the Resale_Value in USD based on the Product_Metadata and Condition_Grade
2. THE AI_Engine SHALL calculate Resale_Value by applying a depreciation factor to the original price based on product age and Condition_Grade
3. WHEN the AI_Engine calculates a Resale_Value, THE Platform SHALL display the value as a range with a minimum and maximum estimate
4. THE AI_Engine SHALL apply category-specific depreciation rates when calculating Resale_Value
5. IF the calculated Resale_Value is less than 1 USD, THEN THE Platform SHALL display "No significant resale value" instead of a numerical estimate

### Requirement 6: Green Credits Generation

**User Story:** As a User, I want to earn green credits for sustainable product decisions, so that I feel motivated to make environmentally responsible choices.

#### Acceptance Criteria

1. WHEN a User completes an Assessment, THE Platform SHALL calculate and award Green_Credits based on the Action_Recommendation followed
2. THE Platform SHALL award 10 Green_Credits for resell actions, 15 Green_Credits for refurbish actions, 20 Green_Credits for donate actions, and 5 Green_Credits for recycle actions
3. WHEN Green_Credits are awarded, THE Platform SHALL store the credits in the Data_Store associated with the User
4. THE Platform SHALL display the total accumulated Green_Credits for the User on the Sustainability_Dashboard
5. WHEN Green_Credits are awarded, THE Platform SHALL display a confirmation showing the credits earned for the current Assessment

### Requirement 7: Sustainability Dashboard

**User Story:** As a User, I want to view a dashboard showing my sustainability impact, so that I can track my environmental contribution over time.

#### Acceptance Criteria

1. THE Platform SHALL display a Sustainability_Dashboard showing total Green_Credits earned, total products assessed, and a breakdown of actions taken by category
2. WHEN a User navigates to the Sustainability_Dashboard, THE Platform SHALL retrieve the User aggregated metrics from the Data_Store
3. THE Platform SHALL display the estimated CO2 savings in kilograms based on the actions completed by the User
4. THE Platform SHALL calculate CO2 savings using the formula: 2.5 kg per resell, 1.8 kg per refurbish, 1.5 kg per donate, and 0.8 kg per recycle
5. WHEN a new Assessment is completed, THE Platform SHALL update the Sustainability_Dashboard metrics within 5 seconds
6. THE Platform SHALL display a visual chart showing the distribution of Action_Recommendations across all User assessments

### Requirement 8: Buyer Recommendation Engine

**User Story:** As a User, I want to see suggested buyer personas for my product, so that I know who is most likely to purchase it and can target the right audience.

#### Acceptance Criteria

1. WHEN the AI_Engine completes an Assessment with an Action_Recommendation of "resell", THE Platform SHALL generate up to 3 buyer persona suggestions
2. THE AI_Engine SHALL determine buyer personas based on product category, Condition_Grade, and estimated Resale_Value
3. WHEN buyer personas are generated, THE Platform SHALL display each persona with a label, a brief description of the buyer profile, and a relevance score between 1 and 10
4. IF the Action_Recommendation is not "resell", THEN THE Platform SHALL skip buyer persona generation and display a message indicating buyer suggestions are available only for resellable products
5. THE AI_Engine SHALL consider product category demand patterns when generating buyer personas

### Requirement 9: Explainable AI

**User Story:** As a User, I want the AI to explain its reasoning for the condition grade and action recommendation, so that I can trust and understand the assessment results.

#### Acceptance Criteria

1. WHEN the AI_Engine assigns a Condition_Grade, THE AI_Engine SHALL generate a human-readable explanation of no more than 150 words describing the visual and contextual factors that influenced the grade
2. WHEN the AI_Engine generates an Action_Recommendation, THE AI_Engine SHALL provide a reasoning summary of no more than 100 words explaining why the recommended action is optimal
3. THE Platform SHALL display the Condition_Grade explanation and Action_Recommendation reasoning alongside the respective results
4. THE AI_Engine SHALL reference specific observable attributes from the Product_Image in the Condition_Grade explanation
5. THE AI_Engine SHALL reference the Condition_Grade, Resale_Value, and product category in the Action_Recommendation reasoning

## Non-Functional Requirements

### Requirement 10: Performance

**User Story:** As a User, I want the platform to respond quickly, so that I can assess products without long wait times.

#### Acceptance Criteria

1. WHEN a User uploads a Product_Image, THE Platform SHALL complete the upload within 5 seconds for files up to 10 MB on a standard broadband connection
2. WHEN the AI_Engine processes a product assessment, THE AI_Engine SHALL return results within 15 seconds of submission
3. WHEN a User navigates between pages, THE Platform SHALL render the new page within 2 seconds

### Requirement 11: Reliability

**User Story:** As a User, I want the platform to be reliable, so that I can trust the assessments and my data is preserved.

#### Acceptance Criteria

1. IF the AI_Engine encounters a transient failure, THEN THE Platform SHALL retry the request up to 3 times with exponential backoff
2. IF the Image_Store is unreachable, THEN THE Platform SHALL queue the upload and retry when connectivity is restored
3. THE Platform SHALL persist all Assessment data to the Data_Store before displaying results to the User

### Requirement 12: Security

**User Story:** As a User, I want my data to be secure, so that my uploaded images and product information remain private.

#### Acceptance Criteria

1. THE Platform SHALL transmit all data between the frontend and backend over HTTPS
2. THE Platform SHALL generate pre-signed URLs with a maximum expiry of 15 minutes for Image_Store access
3. THE Platform SHALL validate and sanitize all User input on the backend before processing

## MVP Scope

The MVP for Amazon HackOn 2026 includes:
- Product image upload with S3 storage (Requirement 1)
- Product metadata entry form (Requirement 2)
- AI-powered condition grading using Amazon Bedrock (Requirement 3)
- Action recommendation engine (Requirement 4)
- Resale value estimation (Requirement 5)
- Green credits calculation and display (Requirement 6)
- Basic sustainability dashboard with metrics (Requirement 7)
- Buyer recommendation engine for resellable products (Requirement 8)
- Explainable AI with reasoning for grades and recommendations (Requirement 9)

## Future Scope

- User authentication and multi-user support
- Assessment history with full detail retrieval and 12-month retention
- Batch product assessment (upload multiple products)
- Marketplace integration for resell recommendations
- Donation partner matching based on location
- Refurbishment cost estimation with repair guides
- Social sharing of sustainability achievements
- Leaderboard for Green_Credits across users
- Mobile-responsive progressive web app
- Barcode/QR code scanning for automatic product identification
- Integration with Amazon product catalog for enhanced metadata

## Assumptions

1. Users have access to a device with a camera or stored product images
2. Users have a stable internet connection for image upload and AI processing
3. Amazon Bedrock multimodal models are available for image analysis in the deployment region
4. Product categories in the predefined list cover the majority of consumer products for the hackathon demo
5. CO2 savings values are approximations for demonstration purposes and are not based on certified lifecycle analysis
6. The MVP operates without user authentication; a single-user session model is sufficient for the hackathon
7. Product images contain a single product photographed against a reasonably clear background
8. The platform processes one product assessment at a time in the MVP

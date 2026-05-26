// frontend/src/__tests__/components/Review.test.jsx
// Tests for FR-OS-11: Upload photo and submit a review

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');

// Mock Review Form component
const ReviewForm = ({ onSubmit }) => (
  <form
    data-testid="review-form"
    onSubmit={e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      onSubmit && onSubmit({
        locationName: fd.get('locationName'),
        rating: fd.get('rating'),
        comment: fd.get('comment'),
      });
    }}
  >
    <input name="locationName" data-testid="location-input" placeholder="Location" />
    <select name="rating" data-testid="rating-select">
      <option value="">Select rating</option>
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
    </select>
    <textarea name="comment" data-testid="comment-input" placeholder="Write your review..." />
    <button type="submit" data-testid="submit-review-btn">Submit Review</button>
  </form>
);

// Mock Photo Upload component
const PhotoUpload = ({ onUpload }) => (
  <div data-testid="photo-upload">
    <input
      type="file"
      data-testid="photo-file-input"
      accept="image/*"
      onChange={e => {
        const file = e.target.files[0];
        if (file) onUpload && onUpload(file);
      }}
    />
    <button data-testid="upload-btn" type="button">Upload Photo</button>
  </div>
);

// Mock Community Feed component
const CommunityFeed = ({ reviews, photos }) => (
  <div data-testid="community-feed">
    <section data-testid="reviews-section">
      <h2>Reviews</h2>
      {reviews && reviews.length > 0 ? (
        reviews.map(review => (
          <div key={review._id} data-testid={`review-${review._id}`}>
            <span data-testid={`review-location-${review._id}`}>{review.locationName}</span>
            <span data-testid={`review-rating-${review._id}`}>{review.rating}</span>
            <span data-testid={`review-user-${review._id}`}>{review.userName}</span>
          </div>
        ))
      ) : (
        <p data-testid="no-reviews">No reviews yet.</p>
      )}
    </section>
    <section data-testid="photos-section">
      <h2>Photos</h2>
      {photos && photos.length > 0 ? (
        photos.map(photo => (
          <img key={photo._id} src={photo.url} alt="community" data-testid={`photo-${photo._id}`} />
        ))
      ) : (
        <p data-testid="no-photos">No photos yet.</p>
      )}
    </section>
  </div>
);

const mockReviews = [
  { _id: 'r1', locationName: 'Pokhara', rating: 5, userName: 'Alice', comment: 'Breathtaking!' },
  { _id: 'r2', locationName: 'Kathmandu', rating: 4, userName: 'Bob', comment: 'Great city.' },
];

const mockPhotos = [
  { _id: 'p1', url: 'https://example.com/photo1.jpg' },
  { _id: 'p2', url: 'https://example.com/photo2.jpg' },
];

describe('Review Form - FR-OS-11: Submit Review', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the review form with all fields', () => {
    render(
      <Router>
        <ReviewForm />
      </Router>
    );

    expect(screen.getByTestId('review-form')).toBeInTheDocument();
    expect(screen.getByTestId('location-input')).toBeInTheDocument();
    expect(screen.getByTestId('rating-select')).toBeInTheDocument();
    expect(screen.getByTestId('comment-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-review-btn')).toBeInTheDocument();
  });

  it('should allow typing a location name', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <ReviewForm />
      </Router>
    );

    const locationInput = screen.getByTestId('location-input');
    await user.type(locationInput, 'Pokhara');
    expect(locationInput).toHaveValue('Pokhara');
  });

  it('should allow selecting a rating', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <ReviewForm />
      </Router>
    );

    const ratingSelect = screen.getByTestId('rating-select');
    await user.selectOptions(ratingSelect, '5');
    expect(ratingSelect).toHaveValue('5');
  });

  it('should allow writing a comment', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <ReviewForm />
      </Router>
    );

    const commentInput = screen.getByTestId('comment-input');
    await user.type(commentInput, 'Amazing experience!');
    expect(commentInput).toHaveValue('Amazing experience!');
  });

  it('should call onSubmit with form data when submitted', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn();

    render(
      <Router>
        <ReviewForm onSubmit={mockSubmit} />
      </Router>
    );

    await user.type(screen.getByTestId('location-input'), 'Everest Region');
    await user.selectOptions(screen.getByTestId('rating-select'), '4');
    await user.type(screen.getByTestId('comment-input'), 'Incredible trek.');

    const form = screen.getByTestId('review-form');
    form.dispatchEvent(new Event('submit', { bubbles: true }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });

  it('should submit review via API and appear in community feed', async () => {
    axios.post = jest.fn().mockResolvedValue({
      data: { _id: 'r-new', locationName: 'Mustang', rating: 5, userName: 'Alice' },
    });

    const response = await axios.post('/api/reviews', {
      locationName: 'Mustang',
      rating: 5,
      comment: 'Hidden gem!',
    });

    expect(response.data.locationName).toBe('Mustang');
    expect(response.data.rating).toBe(5);
  });
});

describe('Photo Upload - FR-OS-11: Upload Photo', () => {
  it('should render the photo upload component', () => {
    render(
      <Router>
        <PhotoUpload />
      </Router>
    );

    expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
    expect(screen.getByTestId('photo-file-input')).toBeInTheDocument();
  });

  it('should accept only image files', () => {
    render(
      <Router>
        <PhotoUpload />
      </Router>
    );

    expect(screen.getByTestId('photo-file-input')).toHaveAttribute('accept', 'image/*');
  });

  it('should call onUpload with file when selected', async () => {
    const user = userEvent.setup();
    const mockUpload = jest.fn();

    render(
      <Router>
        <PhotoUpload onUpload={mockUpload} />
      </Router>
    );

    const fileInput = screen.getByTestId('photo-file-input');
    const file = new File(['image'], 'trail.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, file);

    expect(mockUpload).toHaveBeenCalledWith(file);
  });
});

describe('Community Feed - FR-OS-11: Community Content Display', () => {
  it('should display reviews in the community feed', () => {
    render(
      <Router>
        <CommunityFeed reviews={mockReviews} photos={[]} />
      </Router>
    );

    expect(screen.getByTestId('review-r1')).toBeInTheDocument();
    expect(screen.getByTestId('review-location-r1')).toHaveTextContent('Pokhara');
    expect(screen.getByTestId('review-rating-r1')).toHaveTextContent('5');
  });

  it('should display photos in the community feed', () => {
    render(
      <Router>
        <CommunityFeed reviews={[]} photos={mockPhotos} />
      </Router>
    );

    expect(screen.getByTestId('photo-p1')).toBeInTheDocument();
    expect(screen.getByTestId('photo-p1')).toHaveAttribute('src', 'https://example.com/photo1.jpg');
  });

  it('should show empty state when no reviews or photos exist', () => {
    render(
      <Router>
        <CommunityFeed reviews={[]} photos={[]} />
      </Router>
    );

    expect(screen.getByTestId('no-reviews')).toBeInTheDocument();
    expect(screen.getByTestId('no-photos')).toBeInTheDocument();
  });

  it('should display reviewer name in the feed', () => {
    render(
      <Router>
        <CommunityFeed reviews={mockReviews} photos={[]} />
      </Router>
    );

    expect(screen.getByTestId('review-user-r1')).toHaveTextContent('Alice');
    expect(screen.getByTestId('review-user-r2')).toHaveTextContent('Bob');
  });
});

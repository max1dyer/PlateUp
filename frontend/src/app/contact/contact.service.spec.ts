import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ContactService } from './contact.service';

describe('ContactService', () => {
  let service: ContactService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ContactService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the message', () => {
    const message = { name: 'Alice', email: 'a@b.co', message: 'Hello' };

    service.send(message).subscribe();

    expect(http.expectOne({ method: 'POST', url: '/api/contact-messages' }).request.body).toEqual(
      message,
    );
  });
});

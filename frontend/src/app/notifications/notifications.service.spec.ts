import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getNotifications calls the notifications endpoint', () => {
    service.getNotifications().subscribe();

    expect(http.expectOne({ method: 'GET', url: '/api/notifications' })).toBeTruthy();
  });

  it('markRead posts to the read route', () => {
    service.markRead('n1').subscribe();

    expect(http.expectOne({ method: 'POST', url: '/api/notifications/n1/read' })).toBeTruthy();
  });
});

import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { errorMessage } from '../core/api';
import { readImageFile } from '../core/image-file';
import { SessionService } from '../core/session.service';
import { ToastService } from '../core/toast.service';
import { MAX_BIO_LENGTH, MAX_DISPLAY_NAME_LENGTH, User } from './user.models';
import { UsersService } from './users.service';

/** Edits the signed-in user's display name, bio, and profile picture (UC25). */
@Component({
  selector: 'app-profile-edit-form',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-edit-form.html',
  styleUrl: './profile-edit-form.css',
})
export class ProfileEditForm implements OnInit {
  public readonly user = input.required<User>();
  public readonly closed = output<void>();

  protected readonly maxDisplayName = MAX_DISPLAY_NAME_LENGTH;
  protected readonly maxBio = MAX_BIO_LENGTH;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    displayName: new FormControl('', { nonNullable: true }),
    bio: new FormControl('', { nonNullable: true }),
    profilePictureUrl: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private readonly users: UsersService,
    private readonly session: SessionService,
    private readonly toasts: ToastService,
  ) {}

  public ngOnInit(): void {
    const user = this.user();
    this.form.setValue({
      displayName: user.displayName,
      bio: user.bio,
      profilePictureUrl: user.profilePictureUrl ?? '',
    });
  }

  protected onPictureChosen(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    readImageFile(file).then(
      (dataUrl) => this.form.controls.profilePictureUrl.setValue(dataUrl),
      (error: Error) => this.error.set(error.message),
    );
  }

  protected removePicture(): void {
    this.form.controls.profilePictureUrl.setValue('');
  }

  protected save(): void {
    const { displayName, bio, profilePictureUrl } = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.users
      .updateMe({ displayName, bio, profilePictureUrl: profilePictureUrl.trim() || null })
      .subscribe({
        next: (user) => {
          this.saving.set(false);
          this.session.setUser(user);
          this.toasts.success('Profile saved');
          this.closed.emit();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.error.set(errorMessage(error));
        },
      });
  }
}

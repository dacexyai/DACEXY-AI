"""Initial database schema

Revision ID: 001
Revises: 
Create Date: 2026-08-20 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create initial tables: users, subscriptions, licenses."""
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('company', sa.String(255), nullable=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email', name='uq_users_email')
    )
    
    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False, unique=True),
        sa.Column('plan', sa.String(50), nullable=False, server_default='starter'),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('razorpay_customer_id', sa.String(255), nullable=True),
        sa.Column('razorpay_subscription_id', sa.String(255), nullable=True),
        sa.Column('current_period_end', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', name='uq_subscriptions_user_id')
    )
    
    # Create licenses table
    op.create_table(
        'licenses',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False, unique=True),
        sa.Column('key', sa.String(255), nullable=False, unique=True),
        sa.Column('machine_id', sa.String(255), nullable=True),
        sa.Column('active', sa.Boolean, nullable=False, server_default='1'),
        sa.Column('last_seen_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', name='uq_licenses_user_id'),
        sa.UniqueConstraint('key', name='uq_licenses_key')
    )
    
    # Create payments table (for Razorpay)
    op.create_table(
        'payments',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('razorpay_payment_id', sa.String(255), nullable=False, unique=True),
        sa.Column('razorpay_order_id', sa.String(255), nullable=False, unique=True),
        sa.Column('amount', sa.Integer, nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='INR'),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('signature', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    
    # Create indexes for common queries
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_licenses_key', 'licenses', ['key'])
    op.create_index('idx_licenses_machine_id', 'licenses', ['machine_id'])
    op.create_index('idx_subscriptions_user_id', 'subscriptions', ['user_id'])
    op.create_index('idx_subscriptions_razorpay_customer_id', 'subscriptions', ['razorpay_customer_id'])
    op.create_index('idx_payments_user_id', 'payments', ['user_id'])
    op.create_index('idx_payments_razorpay_order_id', 'payments', ['razorpay_order_id'])


def downgrade() -> None:
    """Drop all tables."""
    op.drop_table('payments')
    op.drop_table('licenses')
    op.drop_table('subscriptions')
    op.drop_table('users')

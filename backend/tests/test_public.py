"""Regression tests for public hub exposure predicates."""

import pytest

from api.routers.public import is_public_record


@pytest.mark.parametrize(
    ("record", "expected"),
    [
        (
            {
                "is_global_public": True,
                "record_data": {"is_global_public": True},
            },
            True,
        ),
        (
            {
                "is_global_public": False,
                "record_data": {"is_global_public": True},
            },
            False,
        ),
        (
            {
                "is_global_public": True,
                "record_data": {"is_global_public": False},
            },
            False,
        ),
        ({"is_global_public": True, "record_data": "{malformed"}, False),
        ({"is_global_public": True, "record_data": []}, False),
        (
            {
                "is_global_public": True,
                "record_data": '{"is_global_shared": "true"}',
            },
            True,
        ),
    ],
)
def test_is_public_record_requires_synchronized_flags(record, expected):
    assert is_public_record(record) is expected
